<template>
  <Transition name="fade">
    <div v-if="show" class="ai-modal-overlay" @click.self="$emit('close')">
      <div class="ai-modal-content">
        
        <div class="loading-spinner" v-if="isLoading"></div>
        <h3 v-if="isLoading">
            <span class="loading-text">AI is gathering data... Please wait.</span>
        </h3>
        
        <template v-else>
            <h3 class="result-title">✅ **Estimate Ready!**</h3>
            <p class="result-subtitle">Based on typical projects in Everett, MA, your preliminary estimate is:</p>
            
            <p class="estimate-result-container">
                <span class="estimate-result">{{ estimateRange }}</span>
            </p>
            
            <small class="disclaimer">Disclaimer: This is an AI-generated estimate. Contact us for a precise, on-site quote!</small>
            
            <Button @click="$emit('close')" type="secondary" text="Close" class="close-btn" />
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import Button from './Button.vue';

defineProps({
  show: { type: Boolean, required: true },
  isLoading: { type: Boolean, default: false },
  estimateRange: { type: String, default: 'N/A' },
});

defineEmits(['close']);
</script>

<style scoped>
.ai-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.ai-modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.result-title {
    color: #27ae60;
    font-size: 1.8rem;
    margin-bottom: 5px;
}

.result-subtitle {
    color: #555;
    margin-bottom: 20px;
}

.estimate-result-container {
    background: #f6fff9;
    border: 1px solid #e0ffe0;
    padding: 10px 0;
    margin: 15px 0 25px;
    border-radius: 8px;
}

.estimate-result { 
    font-size: 2.5rem; 
    font-weight: 800;
    color: #27ae60; 
}

.disclaimer {
    display: block;
    margin-top: 10px;
    color: #888;
    font-size: 0.85rem;
}

.close-btn { 
    margin-top: 25px; 
}

/* --- Loading Indicator (Spinner) --- */

.loading-text {
    color: #3498db;
    display: block;
    margin-top: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
  margin: 0 auto 20px;
}

/* --- Transições do Modal --- */

.fade-enter-active, .fade-leave-active { 
    transition: opacity 0.3s ease, transform 0.3s ease; 
}

.fade-enter-from, .fade-leave-to { 
    opacity: 0;
    transform: scale(0.95);
}
</style>