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
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Preset } from "matrix-js-sdk";
import type { GroupDetails } from "../CreateGroupDialog";

type Params = {
  groupDetails: GroupDetails | undefined,
  onNext: (p: GroupDetails) => void,
}


export default function GroupDetailsStep(params: Params) {

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title")).trim();
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
            <Input defaultValue={params.groupDetails?.title} id="title" name="title" type="text" placeholder="" required />
          </Field>
          <FieldSet className="w-full">
            <FieldLegend variant="label">Group Type</FieldLegend>
            <RadioGroup name="preset" defaultValue={params.groupDetails?.preset}>
              <FieldLabel htmlFor="preset-private" className="font-normal">
                <Field orientation="horizontal">
                  <RadioGroupItem value={Preset.PrivateChat} id="preset-private" />
                  <FieldContent>
                    <FieldTitle>Private</FieldTitle>
                    <FieldDescription>
                      People can only join if they are added
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="preset-public" className="font-normal">
                <Field orientation="horizontal">
                  <RadioGroupItem value={Preset.PublicChat} id="preset-public" />
                  <FieldContent>
                    <FieldTitle>Public</FieldTitle>
                    <FieldDescription>
                      Anyone can find the group in search and join, chat history is available to everybody
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </RadioGroup>
          </FieldSet>
        </FieldGroup>

        <DialogFooter className="grid grid-cols-4 mt-10">
          <DialogClose asChild className="col-start-3">
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" className="col-start-4">Next</Button>
        </DialogFooter>

      </form>
    </>


  );
}