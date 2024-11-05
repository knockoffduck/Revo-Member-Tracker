"use client";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { signOut } from "../auth/actions";

const Logout = async () => {
	const [countdown, setCountdown] = useState(5);
	await signOut();
	useEffect(() => {
		// Set a timeout to redirect after 5 seconds
		const interval = setInterval(() => {
			setCountdown((prevCountdown) => prevCountdown - 1);
		}, 1000);

		if (countdown === 0) {
			redirect("/");
		}

		// Cleanup timer if component unmounts before 5 seconds
		return () => clearTimeout(interval);
	}, [countdown]);

	return (
		<div style={{ textAlign: "center", marginTop: "50px" }}>
			<h1>Redirecting in {countdown} seconds...</h1>
			<p>You will be redirected shortly.</p>
		</div>
	);
};

export default Logout;
