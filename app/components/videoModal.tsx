import React from 'react';
import {
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody
} from "@chakra-ui/react";
import MathComponent from './MathComponent';
import { problemSet } from '../utils/problemGenerator';
import { videoMap } from '../utils/problemGenerator';

interface videoModalProps {
    // Define any props you might want to pass, such as loading state or changelog data
    trick: number
}

export const VideoModal: React.FC<videoModalProps> = ({trick}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <button onClick={onOpen} className="hover:scale-105 hover:bg-orange-500 flex font-extrabold md:w-1/4 w-1/2 justify-center text-center items-center mt-auto h-full duration-200 ease-in-out  text-4xl align-baseline text-white rounded-r-2xl bg-orange-400 p-4">
                ?
            </button>
            <Modal size="3xl" isOpen={isOpen} isCentered onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="4xl" className="underline mt-8 text-orange-400 text-center">
                    <MathComponent math={problemSet[Number(trick)]}/>
                    </ModalHeader>
                    <ModalCloseButton fontSize="xl" className="text-orange-400" />
                    <ModalBody fontSize="3xl">
                        <div className="relative mb-8" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', background: '#000', marginTop: '16px' }}>
                            <video
                                controls
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                <source src={`/project sense vids/${videoMap[trick]}`} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
