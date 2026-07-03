import { useState, useRef, useEffect } from "react";
import { SyntaxStyle, RGBA } from "@opentui/core";
import type { ScrollBoxRenderable } from "@opentui/core";
import { TextInput } from "./input";

interface ToolCall {
  id: string;
  name: string;
  input: string;
  output?: string;
  status: "calling" | "completed" | "failed";
}

interface Message {
  query: string;
  thought: string;
  response: string;
  duration: string;
  streaming: boolean;
  toolCalls?: ToolCall[];
}

const syntaxStyle = SyntaxStyle.fromStyles({
  "markup.heading.1": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.heading.2": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.heading.3": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.list": { fg: RGBA.fromHex("#5e73a8") },
  "markup.raw": { fg: RGBA.fromHex("#a5d6ff") },
  default: { fg: RGBA.fromHex("#f8f8f1") },
});

export function Chat() {
  const [screen, setScreen] = useState<"initial" | "chat">("initial");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollBoxRenderable>(null);

  const streamResponse = async (query: string) => {
    const startTime = Date.now();
    try {
      const response = await fetch("http://localhost:8081/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let rawReasoning = "";
      let rawText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));

              if (data.type === "reasoning-delta" && data.delta) {
                rawReasoning += data.delta;
              }
              else if (data.type === "text-delta" && data.delta) {
                rawText += data.delta;
              }
              else if (data.type === "tool-input-start") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0) {
                    const last = updated[lastIndex]!;
                    const toolCalls = last.toolCalls ? [...last.toolCalls] : [];
                    toolCalls.push({
                      id: data.toolCallId,
                      name: data.toolName,
                      input: "",
                      status: "calling",
                    });
                    updated[lastIndex] = { ...last, toolCalls };
                  }
                  return updated;
                });
              }
              else if (data.type === "tool-input-delta") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0) {
                    const last = updated[lastIndex]!;
                    const toolCalls = last.toolCalls ? last.toolCalls.map((tc) => {
                      if (tc.id === data.toolCallId) {
                        return { ...tc, input: tc.input + data.inputTextDelta };
                      }
                      return tc;
                    }) : [];
                    updated[lastIndex] = { ...last, toolCalls };
                  }
                  return updated;
                });
              }
              else if (data.type === "tool-input-available") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0) {
                    const last = updated[lastIndex]!;
                    const toolCalls = last.toolCalls ? last.toolCalls.map((tc) => {
                      if (tc.id === data.toolCallId) {
                        return { ...tc, input: JSON.stringify(data.input) };
                      }
                      return tc;
                    }) : [];
                    updated[lastIndex] = { ...last, toolCalls };
                  }
                  return updated;
                });
              }
              else if (data.type === "tool-output-available") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0) {
                    const last = updated[lastIndex]!;
                    const toolCalls = last.toolCalls ? last.toolCalls.map((tc) => {
                      if (tc.id === data.toolCallId) {
                        return {
                          ...tc,
                          output: JSON.stringify(data.output),
                          status: "completed" as const,
                        };
                      }
                      return tc;
                    }) : [];
                    updated[lastIndex] = { ...last, toolCalls };
                  }
                  return updated;
                });
              }

              // Update last message with new thought/response content
              if (data.type === "reasoning-delta" || data.type === "text-delta") {
                let thought = "";
                let responseText = "";

                if (rawText.includes("<think>")) {
                  const thinkStart = rawText.indexOf("<think>") + 7;
                  const thinkEnd = rawText.indexOf("</think>");
                  if (thinkEnd !== -1) {
                    thought = rawText.slice(thinkStart, thinkEnd).trim();
                    responseText = rawText.slice(thinkEnd + 8).trim();
                  } else {
                    thought = rawText.slice(thinkStart).trim();
                  }
                } else {
                  thought = rawReasoning.trim();
                  responseText = rawText.trim();
                }

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0) {
                    const last = updated[lastIndex]!;
                    updated[lastIndex] = {
                      query: last.query,
                      thought: thought || "Thinking...",
                      response: responseText,
                      duration: elapsed,
                      streaming: true,
                      toolCalls: last.toolCalls,
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              // Ignore incomplete line JSON parsing errors
            }
          }
        }
      }

      // Final timer calculation & end of streaming
      const finalDuration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          const last = updated[lastIndex]!;
          updated[lastIndex] = {
            query: last.query,
            thought: last.thought,
            response: last.response,
            duration: finalDuration,
            streaming: false,
            toolCalls: last.toolCalls,
          };
        }
        return updated;
      });

    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          const last = updated[lastIndex]!;
          updated[lastIndex] = {
            query: last.query,
            thought: "Failed to connect",
            response: "Could not contact the local chat API. Is the backend server running?",
            duration: "0.0s",
            streaming: false,
            toolCalls: last.toolCalls,
          };
        }
        return updated;
      });
    }
  };

  const handleInitialSubmit = (query: string) => {
    const initialMessage: Message = {
      query,
      thought: "Thinking...",
      response: "",
      duration: "0.0s",
      streaming: true,
      toolCalls: [],
    };
    setMessages([initialMessage]);
    setScreen("chat");
    streamResponse(query);
  };

  const handleChatSubmit = (query: string) => {
    const newMessage: Message = {
      query,
      thought: "Thinking...",
      response: "",
      duration: "0.0s",
      streaming: true,
      toolCalls: [],
    };
    setMessages((prev) => [...prev, newMessage]);
    streamResponse(query);
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

          {/* Input component */}
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
                {msg.thought && <text fg="#5e73a8">{msg.thought}</text>}
                
                {/* Tool Calls Display */}
                {msg.toolCalls && msg.toolCalls.map((tc, tcIdx) => (
                  <box
                    key={tcIdx}
                    flexDirection="column"
                    border={["left"]}
                    borderColor="#ff6ec9"
                    paddingLeft={2}
                    marginY={1}
                  >
                    <text fg="#a5d6ff">
                      <strong>🛠️ Tool Call: {tc.name}</strong>
                    </text>
                    <text fg="#5e73a8">Input: <span fg="#f8f8f1">{tc.input}</span></text>
                    {tc.status === "completed" && (
                      <text fg="#5e73a8">Result: <span fg="#a5d6ff">{tc.output}</span></text>
                    )}
                    {tc.status === "calling" && (
                      <text fg="#ff6ec9"><em>Executing...</em></text>
                    )}
                  </box>
                ))}

                <box height={1} />
                {msg.response && (
                  <markdown
                    content={msg.response}
                    syntaxStyle={syntaxStyle}
                    conceal={true}
                    streaming={msg.streaming}
                    width={70}
                  />
                )}
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
