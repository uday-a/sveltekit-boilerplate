<script lang="ts">
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Hero01 from '$lib/components/blocks/hero-01/Hero01.svelte'
  import Logos01 from '$lib/components/blocks/logos/Logos01.svelte'
  import Features01 from '$lib/components/blocks/features-01/Features01.svelte'
  import Bento01 from '$lib/components/blocks/bento-01/Bento01.svelte'
  import Pricing01 from '$lib/components/blocks/pricing-01/Pricing01.svelte'
  import Testimonials01 from '$lib/components/blocks/testimonial/Testimonials01.svelte'
  import Faq01 from '$lib/components/blocks/faq-01/Faq01.svelte'
  import Contact01 from '$lib/components/blocks/contact-01/Contact01.svelte'
  import Cta01 from '$lib/components/blocks/cta-01/Cta01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'
</script>

<svelte:head>
  <title>The workspace your team will actually use | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <a
    href="#main-content"
    class="bg-background text-foreground ring-ring sr-only z-50 rounded-md text-sm font-medium shadow-md ring-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
  >Skip to content</a>
  <Header01 />
  <main id="main-content" tabindex="-1" class="[&>section]:scroll-mt-20 outline-none">
    <section id="top">
      <Hero01 />
    </section>
    <section id="logos">
      <Logos01 />
    </section>
    <section id="features">
      <Features01 />
    </section>
    <section id="bento">
      <Bento01 />
    </section>
    <section id="pricing">
      <Pricing01 />
    </section>
    <section id="customers">
      <Testimonials01 />
    </section>
    <section id="faq">
      <Faq01 />
    </section>
    <section id="contact">
      <Contact01 />
    </section>
    <section id="cta">
      <Cta01 />
    </section>
  </main>
  <Footer01 />
</div>
