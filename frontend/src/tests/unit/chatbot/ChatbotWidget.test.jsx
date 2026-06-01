import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChatbotWidget from "../../../components/ChatbotWidget";
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  streamConversationMessage,
} from "../../../api/chatbot";

jest.mock("../../../api/chatbot", () => ({
  createConversation: jest.fn(),
  deleteConversation: jest.fn(),
  getConversationMessages: jest.fn(),
  listConversations: jest.fn(),
  streamConversationMessage: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appConfirm: jest.fn(async () => true),
}));

jest.mock("framer-motion", () => {
  const ReactRuntime = require("react");
  const stripMotionProps = (props = {}) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      variants,
      ...rest
    } = props;
    return rest;
  };
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, tag) =>
        ({ children, ...props }) =>
          ReactRuntime.createElement(String(tag), stripMotionProps(props), children),
    }
  );
  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: motionProxy,
  };
});

describe("ChatbotWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listConversations.mockResolvedValue([]);
    getConversationMessages.mockResolvedValue({ conversation: null, messages: [] });
    createConversation.mockResolvedValue({
      id: "conv-1",
      title: "Nouvelle conversation",
      updatedAt: new Date().toISOString(),
    });
    deleteConversation.mockResolvedValue(true);
    streamConversationMessage.mockResolvedValue({
      conversationId: "conv-1",
      mode: "guide_smsi",
    });
  });

  test("ouvre le widget et charge la liste des conversations", async () => {
    render(<ChatbotWidget />);

    fireEvent.click(screen.getByRole("button", { name: /ouvrir le chatbot smsi/i }));

    await waitFor(() => {
      expect(listConversations).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/creez une conversation pour demarrer/i)).toBeInTheDocument();
  });

  test("affiche un message clair quand la permission chatbot est refusee", async () => {
    listConversations.mockRejectedValueOnce({
      code: "CHATBOT_PERMISSION_DENIED",
      message: "Acces refuse",
    });

    render(<ChatbotWidget />);
    fireEvent.click(screen.getByRole("button", { name: /ouvrir le chatbot smsi/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/votre role ne dispose pas de la permission chatbot/i)
      ).toBeInTheDocument();
    });
  });
});
