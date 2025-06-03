@tailwind base;
@tailwind components;
@tailwind utilities;

/* Mobile viewport fixes */
@media (max-width: 768px) {
  .glass-effect {
    margin-left: 0;
    margin-right: 0;
    border-radius: 0.5rem;
  }
  
  #root {
    width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  body {
    width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }
}

/* Custom scrollbar styles */
#chat-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

#chat-container::-webkit-scrollbar {
  width: 6px;
}

#chat-container::-webkit-scrollbar-track {
  background: transparent;
}

#chat-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

#chat-container::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Smooth scrolling for the entire app */
* {
  scroll-behavior: smooth;
}

:root {
  --background: 0 0% 100%;
  --foreground: 20 14.3% 4.1%;
  --muted: 60 4.8% 95.9%;
  --muted-foreground: 25 5.3% 44.7%;
  --popover: 0 0% 100%;
  --popover-foreground: 20 14.3% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 20 14.3% 4.1%;
  --border: 20 5.9% 90%;
  --input: 20 5.9% 90%;
  --primary: 249 100% 69%;
  --primary-foreground: 211 100% 99%;
  --secondary: 312 73% 70%;
  --secondary-foreground: 24 9.8% 10%;
  --accent: 60 4.8% 95.9%;
  --accent-foreground: 24 9.8% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 60 9.1% 97.8%;
  --ring: 20 14.3% 4.1%;
  --radius: 0.5rem;
}

/* 👇️ Holy Layout Fix */
html,
body,
#root {
  height: 100%;
  margin: 0;
  padding: 0;
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

/* Custom styles for the app */
.border-3 {
  border-width: 3px;
}

.compact-spacing {
  @apply space-y-2;
}

.compact-padding {
  @apply p-2;
}

.compact-margin {
  @apply m-1;
}

.glass-effect {
  @apply bg-white/80 backdrop-blur-sm border border-gray-200/50;
}

.fixed-bottom-input {
  @apply fixed bottom-20 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg;
}

.text-compact {
  @apply text-xs;
}

.text-compact-sm {
  @apply text-sm;
}

.no-bottom-padding {
  @apply pb-0;
}

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.bg-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
}

.text-primary {
  color: hsl(var(--primary));
}

.text-secondary {
  color: hsl(var(--secondary));
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.focus-visible:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
      }
  
