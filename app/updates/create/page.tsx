import CreateUpdateForm from "./CreateUpdateForm";
import { isAdmin } from "@/lib/updates";
import { redirect } from "next/navigation";

export default async function CreateUpdatePage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/updates");
    }

    return <CreateUpdateForm />;
}
