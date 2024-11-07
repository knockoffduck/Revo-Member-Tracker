import { getUser } from "@/utils/supabase/server";
import { GymsCheckBox } from "./GymsCheckbox";

export default async function GymSelection() {
	const user = (await getUser())?.id;
	console.log(user);
	return (
		<div className="w-screen flex p-8">
			{user && <GymsCheckBox userId={user}></GymsCheckBox>}
		</div>
	);
}
