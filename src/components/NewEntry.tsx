import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { EntryForm } from "@/components/EntryForm";

const NewEntry = () => {
  return (
    <div className="bg-[#1A1F2C] min-h-screen">
      <CenteredLayout>
        <EntryForm />
      </CenteredLayout>
    </div>
  );
};

export default NewEntry;