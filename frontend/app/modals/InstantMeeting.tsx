"use client";
import { useState, Fragment, Dispatch, SetStateAction } from "react";
import { Dialog, DialogTitle, DialogPanel, Transition, Description, TransitionChild } from "@headlessui/react";
import { FaCopy } from "react-icons/fa";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface ModalProps { enable: boolean; setEnable: Dispatch<SetStateAction<boolean>>; }

export default function InstantMeeting({ enable, setEnable }: ModalProps) {
  const [showMeetingLink, setShowMeetingLink] = useState(false);
  const [facetimeLink, setFacetimeLink] = useState("");
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
                {showMeetingLink ? (
                  <MeetingLink facetimeLink={facetimeLink} />
                ) : (
                  <MeetingForm setShowMeetingLink={setShowMeetingLink} setFacetimeLink={setFacetimeLink} />
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Form for starting an instant meeting
const MeetingForm = ({
  setShowMeetingLink,
  setFacetimeLink,
}: {
  setShowMeetingLink: Dispatch<SetStateAction<boolean>>;
  setFacetimeLink: Dispatch<SetStateAction<string>>;
}) => {
  const [description, setDescription] = useState("");
  const client = useStreamVideoClient();
  const { user } = useUser();

  const handleStartMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client || !user) {
      alert("Unable to start meeting – no user or client.");
      return;
    }
    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create meeting");

      // Create the call that starts now (immediate)
      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),    // current time for immediate call
          custom: { description },
        },
      });
      
      // Open the meeting in a new tab
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_FACETIME_HOST || process.env.NEXT_PUBLIC_APP_URL || '');
      const facetimeUrl = `${baseUrl}/facetime/${call.id}`;
      window.open(facetimeUrl, '_blank');
      
      setFacetimeLink(call.id);
      setShowMeetingLink(true);
    } catch (error) {
      console.error(error);
      alert("Failed to start meeting");
    }
  };

  return (
    <>
      <DialogTitle as="h3" className="text-lg font-bold text-green-600">
        Create Instant FaceTime
      </DialogTitle>
      <Description className="text-xs opacity-40 mb-4">
        You can start a new FaceTime instantly.
      </Description>
      <form onSubmit={handleStartMeeting} className="w-full text-left">
        <label className="block text-sm font-medium text-gray-700" htmlFor="description">
          Meeting Description
        </label>
        <input 
          type="text" id="description" value={description} required 
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full text-sm py-2 px-3 border border-gray-300 rounded mb-4"
          placeholder="Enter a description for the meeting"
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Proceed
        </button>
      </form>
    </>
  );
};

// After creating an instant meeting, show link and option to join now
const MeetingLink = ({ facetimeLink }: { facetimeLink: string }) => {
  const [copied, setCopied] = useState(false);
  // Use window.location.origin for proper URL construction, fallback to env var
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_FACETIME_HOST || process.env.NEXT_PUBLIC_APP_URL || '');
  const fullLink = `${baseUrl}/facetime/${facetimeLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <>
      <DialogTitle as="h3" className="text-lg font-bold text-green-600">
        Your FaceTime is Ready!
      </DialogTitle>
      <Description className="text-xs opacity-40 mb-4">
        Share this link or click below to join now.
      </Description>
      <div className="bg-gray-100 p-4 rounded flex items-center justify-between mb-3">
        <p className="text-sm text-gray-700 break-all">{fullLink}</p>
        <button
          onClick={handleCopy}
          className="text-green-600 text-lg cursor-pointer hover:text-green-700 transition-colors"
          title="Copy link"
          type="button"
        >
          <FaCopy />
        </button>
      </div>
      {copied && <p className="text-red-600 text-xs mb-4">Link copied!</p>}
      {/* Link to the call page */}
      <Link href={`/facetime/${facetimeLink}`} className="inline-block bg-green-600 text-white py-2 px-4 rounded">
        Join FaceTime Now
      </Link>
    </>
  );
};
