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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Preset } from "matrix-js-sdk";
import type { GroupDetails } from "../CreateGroupDialog";

type Params = {
    onNext: (p: GroupDetails) => void,
    onClose: () => void
  }


export default function GroupDetailsStep(params: Params) {

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title"));
    const avatar = String(formData.get("avatar"));
    const preset = formData.get("preset") as Preset;
    params.onNext({ title, avatar, preset });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle />
        <DialogDescription />
      </DialogHeader>

      <form className="w-full" onSubmit={handleSubmit}>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Group name</FieldLabel>
            <Input id="title" name="title" type="text" placeholder="" required />
          </Field>

          <RadioGroup name="preset" defaultValue={Preset.PrivateChat}>
            <Field orientation="horizontal">
              <RadioGroupItem value={Preset.PrivateChat} id="preset-private" />
              <FieldLabel htmlFor="preset-private" className="font-normal">
                Private
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value={Preset.PublicChat} id="preset-public" />
              <FieldLabel htmlFor="preset-public" className="font-normal">
                Public
              </FieldLabel>
            </Field>
          </RadioGroup>
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