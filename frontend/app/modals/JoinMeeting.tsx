"use client";
import { useState, Fragment } from "react";
import { Dialog, DialogTitle, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { useRouter } from "next/navigation";

interface ModalProps { enable: boolean; setEnable: React.Dispatch<React.SetStateAction<boolean>>; }

export default function JoinMeeting({ enable, setEnable }: ModalProps) {
  const closeModal = () => setEnable(false);
  return (
    <Transition appear show={enable} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        {/* ... Transition and Dialog setup ... */}
        <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white p-6 text-center">
          <CallLinkForm />
        </DialogPanel>
      </Dialog>
    </Transition>
  );
}

// Form inside the join modal
const CallLinkForm = () => {
  const [link, setLink] = useState("");
  const router = useRouter();

  const handleJoinMeeting = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!link) return;
    // Normalize link: allow full URL or just ID
    const callId = link.startsWith("http") ? link.split("/").pop() : link;
    if (callId) router.push(`/facetime/${callId}`);
  };

  return (
    <>
      <DialogTitle as="h3" className="text-lg font-bold text-green-600">
        Join FaceTime
      </DialogTitle>
      <form onSubmit={handleJoinMeeting} className="w-full text-left mt-4">
        <label className="block text-sm font-medium text-gray-700" htmlFor="link">
          Enter the FaceTime link
        </label>
        <input
          type="url" id="link" value={link} required
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://your-app.com/facetime/meeting-id"
          className="mt-1 block w-full text-sm py-2 px-3 border border-gray-300 rounded mb-4"
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Join now
        </button>
      </form>
    </>
  );
};
