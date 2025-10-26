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
  // Process PlantUML code blocks, but skip those inside markdown code fences
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // Step 1: Temporarily replace code blocks with placeholders to protect them
    const codeBlockPlaceholders: string[] = [];
    let protectedContent = content.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `___CODE_BLOCK_${codeBlockPlaceholders.length}___`;
      codeBlockPlaceholders.push(match);
      return placeholder;
    });
    
    // Step 2: Now process @startuml...@enduml blocks that are NOT in code blocks
    const plantUmlRegex = /@startuml([\s\S]*?)@enduml/g;
    protectedContent = protectedContent.replace(plantUmlRegex, (match, umlContent) => {
      try {
        // Encode PlantUML content
        const encoded = encode(match);
        // Use PlantUML server to render image
        const imageUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
        // Return Markdown image syntax
        return `![PlantUML Diagram](${imageUrl})`;
      } catch (error) {
        console.error('PlantUML encoding error:', error);
        // If encoding fails, return as code block
        return `\`\`\`plantuml\n${match}\n\`\`\``;
      }
    });
    
    // Step 3: Restore code blocks from placeholders
    codeBlockPlaceholders.forEach((block, index) => {
      const placeholder = `___CODE_BLOCK_${index}___`;
      protectedContent = protectedContent.replace(placeholder, block);
    });
    
    return protectedContent;
  }, [content]);

  return (
    <div className={`${styles.markdownPreview} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom code block rendering
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
          // Custom table rendering
          table({ children }) {
            return <table className={styles.table}>{children}</table>;
          },
          // Custom link rendering
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {children}
              </a>
            );
          },
          // Custom image rendering
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