import { useState } from "react";

export function App() {
  const [value, setValue] = useState("");

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
        <ascii-font font="slick" text="Atlas" color="#ff6ec9" />

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
            value={value}
            onChange={setValue}
            placeholder='Ask anything... "What is the tech stack of this project?"'
            placeholderColor="#5e73a8"
            textColor="#f8f8f1"
            cursorColor="#ff6ec9"
            backgroundColor="transparent"
            focused
            width={76}
            height={3}
            wrapMode="word"
          />
        </box>
      </box>
    </box>
  );
}



