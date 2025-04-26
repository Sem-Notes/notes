import { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
} from '@nextui-org/react';
import { forceApproveNote } from '@/admin_note_functions';
import { toast } from 'react-hot-toast';

interface ForceApproveModalProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onApproveSuccess?: () => void;
}

export default function ForceApproveModal({ 
  noteId, 
  isOpen, 
  onClose,
  onApproveSuccess
}: ForceApproveModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const result = await forceApproveNote(noteId);
      if (result.success) {
        toast.success('Note has been force approved');
        onApproveSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to approve note');
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
        <ModalHeader>Force Approve Note</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-2">
            This will force approve the note even if it cannot be approved through normal means. 
            Please use this feature only when necessary.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onPress={handleApprove} 
            isLoading={isLoading}
          >
            Force Approve
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 