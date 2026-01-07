'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function CategoriesIndexPage() {
  return (
    <div className="h-full bg-background/50 p-8 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShinyTitle text="分类管理" className="text-4xl mb-2" as="h1" />
            <p className="text-muted-foreground max-w-xl text-lg font-light tracking-wide">
              维护 Prompt 的 Domain / Scenario 分类结构，构建清晰的知识资产脉络。
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              asChild
              variant="outline"
              className="group border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] transition-all duration-300"
            >
              <Link href="/prompts" className="flex items-center gap-2">
                <Icon icon="mdi:arrow-left" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>返回 PromptHub</span>
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Action Cards */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Link href="/prompts/categories/domains" className="block h-full group">
              <div className="relative h-full overflow-hidden rounded-xl border border-border/50 bg-card/30 p-1 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col p-6">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <Icon icon="mdi:folder" className="h-6 w-6" />
                  </div>

                  <h3 className="mb-2 text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                    Domain 管理
                  </h3>
                  <p className="mb-6 flex-1 text-muted-foreground">
                    一级分类维护。创建、重命名或删除业务领域（Domain），定义知识资产的顶层结构。
                  </p>

                  <div className="flex items-center text-sm font-medium text-primary opacity-70 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
                    进入管理
                    <Icon icon="mdi:arrow-right" className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/prompts/categories/scenarios" className="block h-full group">
              <div className="relative h-full overflow-hidden rounded-xl border border-border/50 bg-card/30 p-1 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col p-6">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <Icon icon="mdi:folder-outline" className="h-6 w-6" />
                  </div>

                  <h3 className="mb-2 text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                    Scenario 管理
                  </h3>
                  <p className="mb-6 flex-1 text-muted-foreground">
                    二级分类维护。在指定 Domain 下管理业务场景（Scenario），细化资产归属。
                  </p>

                  <div className="flex items-center text-sm font-medium text-primary opacity-70 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
                    进入管理
                    <Icon icon="mdi:arrow-right" className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
