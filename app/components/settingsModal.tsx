import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Switch,
} from "@chakra-ui/react";
import { IoMdSettings } from "react-icons/io";
import { TbLogout2 } from "react-icons/tb";

interface User {
  email: string | null;
}

interface SettingsModalProps {
  loading: boolean;
  rightLeft: boolean;
  updateUser: (userId: string, newData: any) => Promise<void>;
  user: User | null;
  setRightLeft: (value: boolean) => void;
  questionLimited: boolean;
  logout: () => void;
  setQuestionLimited: (value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  loading,
  rightLeft,
  updateUser,
  user,
  setRightLeft,
  questionLimited,
  logout,
  setQuestionLimited,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <button
        onClick={onOpen}
        className="ml-5 md:text-5xl text-4xl hover:text-orange-400 hover:scale-110 ease-in-out duration-200"
      >
        <IoMdSettings className="text-4xl hover:text-orange-400 text-orange-300" />
      </button>

      <Modal
        isCentered={true}
        size={["xs", "md", "xl"]}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent className="h-2/5 md:h-auto rounded-2xl">
          <ModalHeader
            fontSize={["2xl", "md", "5xl"]}
            className="mt-5 md:mt-4 text-orange-400 text-center"
          >
            Settings
            <hr className="my-2"></hr>
          </ModalHeader>
          <ModalCloseButton fontSize="xl" className="text-orange-400" />
          <ModalBody fontSize="3xl">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <>
                <FormControl
                  display="flex"
                  alignItems="center"
                  textAlign="center"
                  className="mx-auto items-center justify-center"
                >
                  <FormLabel
                    fontSize={["xl", "md", "2rem"]}
                    htmlFor="email-alerts"
                    mb={[2, 0, 0]}
                  >
                    Answer Right to Left
                  </FormLabel>
                  <Switch
                    defaultChecked={rightLeft}
                    id="email-alerts"
                    size="lg"
                    onChange={() => {
                      updateUser(user?.email ?? "", {
                        rightLeft: !rightLeft,
                      });
                      setRightLeft(!rightLeft);
                    }}
                  />
                </FormControl>
                <FormControl
                  display="flex"
                  alignItems="center"
                  textAlign="center"
                  className="mx-auto items-center justify-center"
                >
                  <FormLabel
                    fontSize={["xl", "md", "2rem"]}
                    htmlFor="email-alerts"
                    mb="0"
                  >
                    Infinite Questions
                  </FormLabel>
                  <Switch
                    defaultChecked={!questionLimited}
                    id="email-alerts"
                    size="lg"
                    onChange={() => {
                      updateUser(user?.email ?? "", {
                        questionLimited: !questionLimited,
                      });
                      setQuestionLimited(!questionLimited);
                    }}
                  />
                </FormControl>
              </>
            )}
            <div className="text-center text-lg md:text-xl mt-5 md:mt-4 ">
              Currently Signed in as: {user ? user.email : ""}
            </div>
            <div className="flex justify-between w-full ">
              <button
                onClick={logout}
                className="items-center flex justify-center text-center duration-200 mt-3 md:mt-2 ease-in-out hover:text-2xl hover:bg-red-900 hover:animate font-extrabold mx-auto mb-2 pr-2 text-lg p-2 rounded-xl text-white bg-red-500 md:p-3 md:text-2xl md:mb-4s"
              >
                <div className="pr-2">Sign out</div>
                <TbLogout2 />
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
