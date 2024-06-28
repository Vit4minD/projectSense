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
import { IoGameControllerOutline } from "react-icons/io5";

interface gameModalProps {
    // Define any props you might want to pass, such as loading state or changelog data
}

export const GameModal: React.FC<gameModalProps> = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <button
                onClick={onOpen}
                className="hover:text-orange-400 text-4xl md:text-5xl mr-5 hover:scale-110 ease-in-out duration-200"
            >
                <IoGameControllerOutline className="text-4xl hover:text-orange-400 text-orange-300" />
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
                        className="text-orange-400 text-center"
                    >
                        Mini Games
                        <hr className=" mx-auto w-2/3"></hr>
                    </ModalHeader>
                    <ModalCloseButton fontSize="xl" className="text-orange-400" />
                    <ModalBody
                        fontSize={["xl", null, "3xl"]}
                        className="overflow-y-auto max-h-[80vh]"
                    >

                        <div
                            className="   h-23 md:h-24 overflow-y-hidden"
                        >
                            <div
                                className={`my-auto h-full duration-200 ease-in-out mx-12 md:mx-8 text-center items-center flex rounded-2xl justify-center text-3xl font-semibold `}
                            >
                                <button
                                    className="text-white p-2 md:p-4 px-[2.7rem] md:w-[26rem] w-full overflow-y-hidden hover:scale-105 hover:bg-orange-400  flex justify-center items-center h-full duration-200 ease-in-out rounded-2xl bg-orange-300 text-xl md:text-2xl"
                                >
                                    Zetamac
                                </button>
                            </div>
                        </div>
                        <div
                            className="  h-23 md:h-24 overflow-y-hidden mt-8 mb-12"
                        >
                            <div
                                className={`my-auto h-full duration-200 ease-in-out mx-12 md:mx-8 text-center items-center flex rounded-2xl justify-center text-3xl font-semibold `}
                            >
                                <button
                                    className="text-white p-2 md:p-4 px-[2.7rem] md:w-[26rem] w-full overflow-y-hidden hover:scale-105 hover:bg-orange-400  flex justify-center items-center h-full duration-200 ease-in-out rounded-2xl bg-orange-300 text-xl md:text-2xl"
                                >
                                    24
                                </button>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
