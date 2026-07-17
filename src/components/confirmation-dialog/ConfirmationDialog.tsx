import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Trash2Icon } from "lucide-react";



type Params = {
    title: string,
    description: string,
    open: boolean,
    loading: boolean,
    onConfirm: () => void,
    // It's called when the dialog is closed
    onClose: () => void
}


export default function ConfirmationDialog(params: Params) {
    return (
        <div className="flex flex-col justify-center items-center">
            <Dialog open={params.open} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    params.onClose();
                }
            }}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader className="gap-4">
                        <DialogTitle className="flex flex-col gap-4 justify-center items-center">
                            <div className="inline-flex items-center justify-center mb-2 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-[8px] size-10">
                                <Trash2Icon />
                            </div>
                            {params.title}
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {params.description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex sm:justify-center">
                        <DialogClose className="w-full sm:w-auto" asChild>
                            <Button variant="outline" className="w-full" disabled={params.loading}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" onClick={() => {
                            params.onConfirm();
                        }} disabled={params.loading}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}