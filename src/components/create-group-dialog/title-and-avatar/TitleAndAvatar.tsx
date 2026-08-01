import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRef } from "react";

type Params = {
  onNext: (p: { title: string, avatar: string }) => void,
  onClose: () => void
}


export default function TitleAndAvatar(params: Params) {
  const groupNameRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // const title = String(formData.get("group-name"));
    const title = groupNameRef.current!.value;
    const avatar = String(formData.get("avatar"));
    params.onNext({ title, avatar });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle/>
        <DialogDescription/>
      </DialogHeader>

      <form className="w-full" onSubmit={handleSubmit}>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="group-name">Group name</FieldLabel>
            <Input id="group-name" ref={groupNameRef} type="text" placeholder="" required />
          </Field>
        </FieldGroup>

        <DialogFooter className="grid grid-cols-4 mt-10">
          <DialogClose asChild className="col-start-3">
            <Button variant="outline" onClick={() => params.onClose()}>Cancel</Button>
          </DialogClose>
          <Button type="submit" className="col-start-4">Next</Button>
        </DialogFooter>

      </form>
    </>


  );
}