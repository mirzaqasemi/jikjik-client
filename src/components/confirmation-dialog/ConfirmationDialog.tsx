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

type Params = {
    confirmAction: string,
    rejectAction: string
    title: string,
    description: string,
    open: boolean,
    loading: boolean,
    // Called when the action is confirmed
    onConfirm: () => void,
    // Called when the dialog is closed
    onClose: () => void,
    icon?: React.ReactNode
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
                        <DialogTitle className="flex gap-4 items-center">
                            {params.icon &&
                                <div className="inline-flex items-center justify-center bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-[8px] size-10">
                                    {params.icon}
                                </div>}
                            {params.title}
                        </DialogTitle>
                        <DialogDescription>
                            {params.description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="grid grid-cols-3">
                        <DialogClose className="w-auto col-start-2" asChild>
                            <Button variant="outline" className="w-full" disabled={params.loading}>{params.rejectAction}</Button>
                        </DialogClose>
                        <Button type="submit" className="col-start-3" onClick={() => {
                            params.onConfirm();
                        }} disabled={params.loading}>{params.confirmAction}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}