"use client";
import { useState, Fragment } from "react";
import { Dialog, DialogTitle, DialogPanel, Transition, TransitionChild } from "@headlessui/react";

interface ModalProps { enable: boolean; setEnable: React.Dispatch<React.SetStateAction<boolean>>; }

export default function JoinMeeting({ enable, setEnable }: ModalProps) {
  const closeModal = () => setEnable(false);
  return (
    <Transition appear show={enable} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl">
                <CallLinkForm setEnable={setEnable} />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Form inside the join modal
const CallLinkForm = ({ setEnable }: { setEnable: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [link, setLink] = useState("");

  const handleJoinMeeting = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!link) return;
    // Normalize link: allow full URL or just ID
    const callId = link.startsWith("http") ? link.split("/").pop() : link;
    if (callId) {
      setEnable(false); // Close modal before navigation
      window.location.href = `/conference/${callId}`;
    }
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
          placeholder="https://your-app.com/conference/meeting-id"
          className="mt-1 block w-full text-sm py-2 px-3 border border-gray-300 rounded mb-4"
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Join now
        </button>
      </form>
    </>
  );
};
