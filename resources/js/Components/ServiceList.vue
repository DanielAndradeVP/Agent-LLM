<template>
  <section class="services-section" aria-label="Services">
    <div class="services-grid">
      <Card
        title="Wooden Deck Construction"
        description="Custom decks and patios built for durability and aesthetics."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#EAB54C" viewBox="0 0 24 24">
            <path d="M2 20h20v2H2z"/>
            <path d="M22.7 1.3c-.4-.4-1-.4-1.4 0l-2 2 3.4 3.4 2-2c.4-.4.4-1 0-1.4l-2-2zM0 18l3-3 5 5-3 3H0v-5z"/>
          </svg>
        </template>
      </Card>

      <Card
        title="Exterior Painting of a Residence"
        description="High-quality exterior painting using premium, long-lasting materials."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#EAB54C" viewBox="0 0 24 24">
            <path d="M2 22h20v2H2z"/>
            <path d="M15.5 3.5l5 5-9 9-5-5 9-9z"/>
          </svg>
        </template>
      </Card>

      <Card
        title="Contemporary Kitchen Remodeling"
        description="Full-service kitchen overhauls: modern design, functionality, and fine finishes."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#EAB54C" viewBox="0 0 24 24">
            <path d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2l10-9z"/>
          </svg>
        </template>
      </Card>

      <Card
        title="Bathroom Design and Remodeling"
        description="Creating elegant and efficient bathrooms, from updates to luxury redesigns."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#EAB54C" viewBox="0 0 24 24">
            <path d="M2 20h20v2H2z"/>
            <path d="M20 10H4v6h16v-6z"/>
          </svg>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup>
import Card from '@/Components/Card.vue';
</script>

<style scoped>
.services-section {
  background: #fff;
  padding: 48px 4%;
}

.services-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 28px;
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1100px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>
