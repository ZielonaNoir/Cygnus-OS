/**
 * PDF 导出工具
 * 使用浏览器端的 jsPDF 库生成 PDF
 */

export interface PDFExportOptions {
    title: string;
    content: string;
    author?: string;
    subject?: string;
}

/**
 * 在浏览器端生成 PDF
 * 注意：这需要在客户端调用，因为使用了浏览器 API
 */
export async function generatePDF(options: PDFExportOptions): Promise<Blob> {
    // 动态导入 jsPDF（如果已安装）
    // 如果没有安装，返回错误提示
    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // 设置文档信息
        doc.setProperties({
            title: options.title,
            author: options.author || 'Cygnus-OS',
            subject: options.subject || 'Project Export',
        });

        // 添加标题
        doc.setFontSize(20);
        doc.text(options.title, 14, 20);

        // 添加内容（简单的文本，复杂内容需要 html2canvas 等库）
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(options.content, 180);
        let y = 30;
        lines.forEach((line: string) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 14, y);
            y += 7;
        });

        // 生成 Blob
        return doc.output('blob');
    } catch (_error) {
        throw new Error('jsPDF is not installed. Please install it: npm install jspdf');
    }
}

/**
 * 下载 PDF
 */
export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
