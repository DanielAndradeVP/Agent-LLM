declare module "ButtonsIconType" {
	export type SizeIconType = {
		[key: string]: string;
	};
	export type StateType =
		| "default"
		| "hover"
		| "pressed"
		| "disabled"
		| "loading"
		| "success";
}
