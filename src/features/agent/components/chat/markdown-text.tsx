import { Fragment } from "react";
import { parseSimpleMarkdown, type InlineNode } from "../../domain/simple-markdown";

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case "bold":
        return <strong key={index}>{node.text}</strong>;
      case "italic":
        return <em key={index}>{node.text}</em>;
      case "code":
        return (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {node.text}
          </code>
        );
      default:
        return <Fragment key={index}>{node.text}</Fragment>;
    }
  });
}

export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-3 break-words">
      {parseSimpleMarkdown(text).map((block, index) => {
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline nodes={item} />
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                <Inline nodes={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
