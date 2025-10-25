import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { encode } from 'plantuml-encoder';
import styles from './styles.module.css';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  // 处理PlantUML代码块
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // 匹配 @startuml ... @enduml 块
    const plantUmlRegex = /@startuml([\s\S]*?)@enduml/g;
    
    return content.replace(plantUmlRegex, (match, umlContent) => {
      try {
        // 编码PlantUML内容
        const encoded = encode(match);
        // 使用PlantUML服务器渲染图片
        const imageUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
        // 返回Markdown图片语法
        return `![PlantUML Diagram](${imageUrl})`;
      } catch (error) {
        console.error('PlantUML encoding error:', error);
        // 如果编码失败，返回代码块
        return `\`\`\`plantuml\n${match}\n\`\`\``;
      }
    });
  }, [content]);

  return (
    <div className={`${styles.markdownPreview} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // 自定义代码块渲染
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className={styles.codeBlock}>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
          },
          // 自定义表格渲染
          table({ children }) {
            return <table className={styles.table}>{children}</table>;
          },
          // 自定义链接渲染
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {children}
              </a>
            );
          },
          // 自定义图片渲染
          img({ src, alt }) {
            return (
              <img 
                src={src} 
                alt={alt} 
                className={styles.image}
                loading="lazy"
              />
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;