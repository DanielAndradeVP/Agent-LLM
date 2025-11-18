<template>
  <div class="card">
    <div class="card-icon" v-if="icon">
      <span>{{ icon }}</span>
    </div>
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-description">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  title: String,
  description: String,
});
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
  padding: 2.2rem 1.8rem;
  text-align: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: default;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
}

.card-icon span {
  display: inline-block;
  font-size: 2.8rem;
  color: #EAB54C; /* dourado solicitado */
  margin-bottom: 0.8rem;
}

.card-title {
  font-weight: 700;
  font-size: 1.15rem;
  color: #152A48;
  margin-bottom: 0.6rem;
}

.card-description {
  font-size: 0.95rem;
  color: #5a5a5a;
  line-height: 1.5;
}
</style>
