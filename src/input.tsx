import { useRef } from "react";
import type { TextareaRenderable } from "@opentui/core";

interface TextInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
}

export function TextInput({ onSubmit, placeholder, focused = true }: TextInputProps) {
  const textareaRef = useRef<TextareaRenderable>(null);

  const handleSubmit = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.plainText.trim();
    if (!text) return;

    onSubmit(text);
    textareaRef.current.setText("");
  };

  const keyBindings = [
    { action: "submit", name: "enter" },
    { action: "newline", name: "enter", shift: true },
  ];

  return (
    <box
      border={["left"]}
      borderColor="#ff6ec9"
      backgroundColor="#43475c"
      flexDirection="column"
      width={80}
      paddingX={2}
      paddingY={1}
    >
      <textarea
        ref={textareaRef}
        placeholder={placeholder || 'Ask anything... "What is the tech stack of this project?"'}
        placeholderColor="#5e73a8"
        textColor="#f8f8f1"
        cursorColor="#ff6ec9"
        backgroundColor="transparent"
        focused={focused}
        width={76}
        height={3}
        wrapMode="word"
        onSubmit={handleSubmit}
        keyBindings={keyBindings as any}
      />

      <box height={1} />

      <box flexDirection="row" gap={1}>
        <text>
          <span fg="#ff6ec9"><strong>Build</strong></span>
          <span fg="#5e73a8"> · </span>
          <span fg="#f8f8f1">DeepSeek V4 Flash Free </span>
          <span fg="#5e73a8">OpenCode Zen</span>
        </text>
      </box>
    </box>
  );
}
