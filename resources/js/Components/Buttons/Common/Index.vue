<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
	name: "MoleculesButtonsCommon",
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
			type: String,
			default: "default",
			validator: (value: string) => {
				return [
					"default",
					"hover",
					"pressed",
					"disabled",
					"loading",
					"success",
				].includes(value);
			},
		},
		iconLeft: {
			type: Boolean,
			default: false,
		},
		iconRight: {
			type: Boolean,
			default: false,
		},
		nameIconLeft: {
			type: String,
			default: "arrow-left",
		},
		nameIconRight: {
			type: String,
			default: "arrow-right",
		},
		text: {
			type: String,
			default: "Lorem Ipsum",
		},
		currentColor: {
			type: String,
			default: "",
		},
		width: {
			type: String,
			default: "100%",
		},
	},
	emits: ["onclick"],
	computed: {
		isStateSuccess() {
			return this.state === "success";
		},
		isStateLoading() {
			return this.state === "loading";
		},
		sizeIcon() {
			if (this.size === "extra-large") return "40px";
			if (this.size === "large") return "32px";
			if (this.size === "medium") return "24px";
			if (this.size === "small") return "16px";
			return "12px";
		},
	},
});
</script>

<template>
	<div
		class="layout anim-loading"
		:class="[type, mode, size, state, iconLeft, iconRight]"
		@click="$emit('onclick')"
	>
		<AtomsIcon
			v-if="iconLeft"
			class="icon-left"
			:name="nameIconLeft"
			filled
			:width="sizeIcon"
			:height="sizeIcon"
		/>
		<AtomsLoading
			v-if="isStateLoading || isStateSuccess"
			:state="isStateSuccess ? 'success' : 'flip'"
			color="white"
			size="large"
		/>
		<span v-else class="text">
			{{ text }}
		</span>
		<AtomsIcon
			v-if="iconRight"
			class="icon-right"
			filled
			:name="nameIconRight"
		/>
	</div>
</template>

<style scoped lang="scss">
@use "styles.module";

.layout {
	width: v-bind(width);
}
</style>
