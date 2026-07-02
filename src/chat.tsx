import { useState, useRef, useEffect } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import { TextInput } from "./input";

interface Message {
  query: string;
  thought: string;
  response: string;
  duration: string;
}

export function Chat() {
  const [screen, setScreen] = useState<"initial" | "chat">("initial");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollBoxRenderable>(null);

  const getMockResponse = (query: string): Message => {
    const clean = query.trim().toLowerCase();
    if (clean === "hi") {
      return {
        query,
        thought: 'The user just said "Hi". I should respond concisely.',
        response: "Hi. What can I help you with?",
        duration: "4.6s",
      };
    } else if (clean.includes("tech stack") || clean.includes("stack") || clean.includes("opentui")) {
      return {
        query,
        thought: "The user wants to know the tech stack. I should explain Bun, React, TypeScript, and OpenTUI.",
        response: "This project is built using Bun as the JS/TS runtime, React for declarative terminal components, TypeScript for type-safety, and OpenTUI for the underlying TUI engine.",
        duration: "2.8s",
      };
    } else {
      return {
        query,
        thought: `The user asked: "${query}". I should provide a helpful response.`,
        response: `I've received your query: "${query}". How else can I assist you with this project?`,
        duration: "1.5s",
      };
    }
  };

  const handleInitialSubmit = (query: string) => {
    const responseMsg = getMockResponse(query);
    setMessages([responseMsg]);
    setScreen("chat");
  };

  const handleChatSubmit = (query: string) => {
    const responseMsg = getMockResponse(query);
    setMessages((prev) => [...prev, responseMsg]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (screen === "initial") {
    return (
      <box
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
        flexDirection="column"
        backgroundColor="#272a37"
      >
        <box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          {/* Title / Banner */}
          <ascii-font font="slick" text="Atlas" color="#ff6ec9" />

          {/* Reusable Input Component */}
          <TextInput onSubmit={handleInitialSubmit} />
        </box>
      </box>
    );
  }

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      width="100%"
      height="100%"
      backgroundColor="#272a37"
      padding={2}
    >
      {/* Conversations Scrollbox */}
      <scrollbox
        ref={scrollRef}
        flexGrow={1}
        height={15}
        backgroundColor="#272a37"
        focused={false}
        style={{
          rootOptions: { backgroundColor: "#272a37" },
          viewportOptions: { backgroundColor: "#272a37" },
        }}
      >
        <box flexDirection="column" paddingRight={2}>
          {messages.map((msg, idx) => (
            <box key={idx} flexDirection="column" marginBottom={2}>
              {/* User Query Block */}
              <box
                border={["left"]}
                borderColor="#ff6ec9"
                paddingLeft={2}
                marginBottom={1}
              >
                <text fg="#f8f8f1"><strong>{msg.query}</strong></text>
              </box>

              {/* Response Block - Indented to align with query text */}
              <box flexDirection="column" paddingLeft={3} gap={1}>
                <text fg="#5e73a8">{msg.thought}</text>
                <box height={1} />
                <text fg="#f8f8f1">{msg.response}</text>
                <box height={1} />
                <text>
                  <span fg="#ff6ec9">▣ </span>
                  <span fg="#f8f8f1">Build </span>
                  <span fg="#5e73a8">· DeepSeek V4 Flash Free · {msg.duration}</span>
                </text>
              </box>
            </box>
          ))}
        </box>
      </scrollbox>

      {/* Spacing */}
      <box height={1} />

      {/* Input Box Container at the bottom centered */}
      <box alignItems="center" width="100%">
        <TextInput onSubmit={handleChatSubmit} />
      </box>
    </box>
  );
}
