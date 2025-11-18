<template>
  <section class="recent-projects">
    <div class="container">

      <h2 class="title">Recent Project</h2>
      <p class="subtitle">
        See the quality of the handcrafted work we offer in a before and after comparison.
      </p>

      <div class="projects-grid">
        <div
          v-for="n in 4"
          :key="n"
          class="project-card"
        >
          <div class="upload-box">
            <input type="file" class="file-input" @change="handleUpload($event, n)" />

            <div class="upload-placeholder">
              <span>Upload Photo {{ n }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
const handleUpload = (event, index) => {
  const file = event.target.files[0];
  if (!file) return;

  console.log("uploaded:", file.name, "in card", index);
};
</script>

<style scoped>
.recent-projects {
  padding: 60px 4%;
  background: #fff;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 10px;
  color: #152A48;
}

.subtitle {
  font-size: 1.1rem;
  max-width: 620px;
  margin: 0 auto 40px;
  color: #7b7b7b;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  max-width: 1200px;
  margin: 0 auto;
}

.project-card {
  background: #f8f8f8;
  border-radius: 14px;
  padding: 20px;
  border: 2px dashed #eab54c;
  cursor: pointer;
  transition: 0.2s;
}

.project-card:hover {
  background: #fff7e6;
  border-color: #d49a3f;
}

.upload-box {
  position: relative;
}

.file-input {
  opacity: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-placeholder {
  padding: 40px 0;
  font-size: 1.1rem;
  color: #152A48;
  font-weight: 600;
}

/* Responsivo */
@media (max-width: 1100px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
