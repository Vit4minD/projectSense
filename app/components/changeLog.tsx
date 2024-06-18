import React from "react";
import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import { BsMailbox2Flag } from "react-icons/bs";
import { IoIosStar } from "react-icons/io";

interface ChangelogModalProps {
  // Define any props you might want to pass, such as loading state or changelog data
}

export const ChangelogModal: React.FC<ChangelogModalProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button
        onClick={onOpen}
        className="hover:text-orange-400 text-4xl md:text-5xl"
      >
        <BsMailbox2Flag className="text-4xl hover:text-orange-400 text-orange-300" />
      </button>

      <Modal
        size={{ base: "xs", md: "3xl" }}
        isOpen={isOpen}
        isCentered={true}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent className="w-4/5 h-2/3 md:max-w-3xl md:h-auto">
          <ModalHeader
            fontSize={["3xl", null, "5xl"]}
            className="underline text-orange-400 text-center"
          >
            <IoIosStar /> Changelog
          </ModalHeader>
          <ModalCloseButton fontSize="xl" className="text-orange-400" />
          <ModalBody
            fontSize={["xl", null, "3xl"]}
            className="overflow-y-auto max-h-[80vh]"
          >
            <div className="p-1 md:p-2">
              Patch 2.2: Home Page Layout Redesign
            </div>
            <hr className="h-1 bg-slate-300" />
            <div className="p-1 md:p-2">
              Patch 2.1: Auto-Enter on Questions added
            </div>
            <hr className="h-1 bg-slate-300" />
            <div className="p-1 md:p-2">
              Update 2.0: LEADERBOARDS + Google Auth
            </div>
            <hr className="h-1 bg-slate-300" />
            <div className="p-1 md:p-2">
              Version 1.0: Project Sense Release!
              <div className="pl-4 md:pl-16">
                - Practice TMSCA/UIL Number Sense Questions using Project Sense
              </div>
              <div className="pl-4 md:pl-16">
                - Solve 5 Questions as Fast as Possible
              </div>
              <div className="pl-4 md:pl-16">
                - 14 Different Numbersense Styled Problems with Tricks and more
                to come
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
