<script lang="ts">
import { defineComponent } from "vue";
import { SizeIconType, StateType } from "ButtonsIconType";

export default defineComponent({
	name: "MoleculesButtonsIcon",
	props: {
		type: {
			type: String,
			default: "primary",
			validator: (value: string) => {
				return ["primary", "secondary", "outline", "only"].includes(value);
			},
		},
		mode: {
			type: String,
			default: "normal",
			validator: (value: string) => {
				return ["normal", "destructive"].includes(value);
			},
		},
		size: {
			type: String,
			default: "large",
			validator: (value: string) => {
				return [
					"extra-large",
					"large",
					"medium",
					"small",
					"extra-small",
				].includes(value);
			},
		},
		state: {
			default: "default",
			type: String,
			validator: (value: string) => {
				return [
					"default",
					"hover",
					"pressed",
					"disabled",
					"loading",
					"success",
				].includes(value as StateType);
			},
		},
		nameIcon: {
			type: String,
			default: "arrow-left",
		},
		currentColor: {
			type: String,
			default: "",
		},
	},
	emits: ["onclick"],
	computed: {
		isDisabled() {
			return this.state === "disabled";
		},
		isStateSuccess() {
			return this.state === "success";
		},
		isStateLoading() {
			return this.state === "loading";
		},
		sizeIcon(): string {
			const sizes: SizeIconType = {
				"extra-large": "28px",
				large: "24px",
				medium: "20px",
				small: "18px",
				"extra-small": "16px",
			};

			return sizes[this.size];
		},
		iconColor(): string {
			if (this.isDisabled) {
				return "var(--neutral-color-light-800)";
			}

			return this.currentColor;
		},
	},
});
</script>

<template>
	<div
		class="layout"
		:class="[type, mode, size, state]"
		@click="$emit('onclick')"
	>
		<AtomsLoading
			v-if="isStateLoading || isStateSuccess"
			:state="isStateSuccess ? 'success' : 'flip'"
			color="white"
			size="large"
		/>
		<AtomsIcon
			v-else
			:current-color="iconColor"
			class="icon-left"
			:name="nameIcon"
			:width="sizeIcon"
			:height="sizeIcon"
		/>
	</div>
</template>

<style scoped lang="scss">
@use "styles.module";
</style>
