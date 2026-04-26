<script>
  import Nav from "../components/Nav.svelte";
  import Hero from "../components/Hero.svelte";
  import Vision from "../components/Vision.svelte";
  import DarkAgentFactory from "../components/DarkAgentFactory.svelte";
  import DarkFactory from "../components/DarkFactory.svelte";
  import SixtySecond from "../components/SixtySecond.svelte";
  import SemanticZoom from "../components/SemanticZoom.svelte";
  import Vocabulary from "../components/Vocabulary.svelte";
  import Nesting from "../components/Nesting.svelte";
  import Ecosystem from "../components/Ecosystem.svelte";
  import TechStack from "../components/TechStack.svelte";
  import RuneLayer from "../components/RuneLayer.svelte";
  import Cta from "../components/Cta.svelte";
  import Footer from "../components/Footer.svelte";
</script>

<svelte:head>
  <title>RuneFort — Spatial cognition for autonomous workflows</title>
  <meta
    name="description"
    content="Dark factories run with the lights off. RuneFort turns them back on — not with dashboards, but with a place you can walk through. Spatial visualization for AI operating systems, agent workflows, and continual learning loops."
  />
</svelte:head>

<!-- Ambient glows -->
<div class="glow glow-1"></div>
<div class="glow glow-2"></div>

<Nav />
<Hero />
<Vision />
<DarkAgentFactory />
<DarkFactory />
<SixtySecond />
<SemanticZoom />
<Vocabulary />
<Nesting />
<Ecosystem />
<TechStack />
<RuneLayer />
<Cta />
<Footer />
