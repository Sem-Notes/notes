import { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Textarea,
  useDisclosure
} from '@nextui-org/react';
import { forceRejectNote } from '@/admin_note_functions';
import { toast } from 'react-hot-toast';

interface ForceRejectModalProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onRejectSuccess?: () => void;
}

export default function ForceRejectModal({ 
  noteId, 
  isOpen, 
  onClose,
  onRejectSuccess
}: ForceRejectModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await forceRejectNote(noteId, reason);
      if (result.success) {
        toast.success('Note has been force rejected');
        onRejectSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to reject note');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Force Reject Note</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-2">
            This will force reject the note even if it cannot be rejected through normal means. 
            Please use this feature only when necessary.
          </p>
          <Textarea
            label="Rejection Reason"
            placeholder="Enter a reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minRows={3}
            isRequired
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="danger" 
            onPress={handleReject} 
            isLoading={isLoading}
          >
            Force Reject
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 