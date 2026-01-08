import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { resolvePromptPath } from '../_utils';

// Initialize Supabase Admin Client for API Route
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { promptId, versionId } = await request.json();

        if (!promptId || !versionId) {
            return NextResponse.json({ ok: false, error: 'Missing promptId or versionId' }, { status: 400 });
        }

        // 1. Fetch the historical content from prompt_versions
        const { data: versionData, error: versionError } = await supabase
            .from('prompt_versions')
            .select('content, version')
            .eq('id', versionId)
            .single();

        if (versionError || !versionData) {
            return NextResponse.json({ ok: false, error: 'Version not found' }, { status: 404 });
        }

        // 2. Fetch Prompt Metadata and JOIN with prompt_repos to get the path
        const { data: promptData, error: promptError } = await supabase
            .from('prompts')
            .select(`
                repo_id,
                prompt_repos!inner (
                    path
                )
            `)
            .eq('id', promptId)
            .single();

        if (promptError || !promptData || !promptData.prompt_repos) {
            console.error('Prompt query error:', promptError);
            return NextResponse.json({ ok: false, error: 'Prompt not found' }, { status: 404 });
        }

        // Extract path from the joined data
        const repoPath = (promptData.prompt_repos as unknown as { path: string }).path;

        if (!repoPath) {
            return NextResponse.json({ ok: false, error: 'Prompt path not found' }, { status: 404 });
        }

        // Convert ltree path (e.g., "Coding.Backend.API-Architect") to filesystem path
        const fsPath = repoPath.replace(/\./g, '/');
        const targetDir = await resolvePromptPath(fsPath);

        if (!targetDir) {
            return NextResponse.json({ ok: false, error: 'Prompt directory not found on filesystem' }, { status: 500 });
        }

        const targetPath = path.join(targetDir, 'main.prompt');

        // 3. Write to Local Filesystem
        await fs.writeFile(targetPath, versionData.content, 'utf8');

        // 4. Update Prompts Table (Current State)
        await supabase
            .from('prompts')
            .update({
                content: versionData.content,
                updated_at: new Date().toISOString()
            })
            .eq('id', promptId);

        // 5. Create New Snapshot (The "Revert" record)
        // We append a suffix or just use current version? 
        // Ideally we should increment version, but for simplicity we'll just log it.
        // Let's call it "Revert to vX.X.X"

        await supabase
            .from('prompt_versions')
            .insert({
                prompt_id: promptId,
                version: versionData.version,
                content: versionData.content,
                summary: `Reverted to ${versionData.version}`,
                created_by: null
            });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Revert failed:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
