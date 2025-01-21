<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { user } from "$lib/stores/auth";
  import type { GoogleUser, SpreadsheetRow } from "$lib/types";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";

  export let data: PageData;

  let finalData: any[] = [];
  let loading = true;
  let error: string | null = null;

  const SPREADSHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6hmCR_BMArUDnOpmc3ir3dGS3VQ4uBNaSOhuNFuuo_VUQgS-ovKYgGlNuJjs4Eq61ddNkECz-bynp/pub?gid=0&single=true&output=csv";

  let googleScriptLoaded = false;

  async function initializeGoogleAuth() {
    const clientId =
      "382380825029-rnd0cj6b98nvf2ctd3kceohfjvo3m7ia.apps.googleusercontent.com";

    return new Promise<void>((resolve) => {
      if (!window.google || !window.google.accounts) {
        console.error("Google Identity Services not loaded");
        error = "Google authentication services failed to load";
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: "popup",
        });

        setTimeout(() => {
          const buttonElement = document.getElementById("googleButton");
          if (buttonElement) {
            window.google.accounts.id.renderButton(buttonElement, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 250,
            });
          } else {
            console.error("Google button element not found");
            error = "Failed to render login button";
          }
        }, 100);

        googleScriptLoaded = true;
      } catch (err) {
        console.error("Error initializing Google Auth:", err);
        error = "Failed to initialize Google authentication";
      }

      resolve();
    });
  }

  async function handleCredentialResponse(response: any) {
    try {
      const token = response.credential;
      
      const authResponse = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token })
      });
      
      const authData = await authResponse.json();
      
      if (!authData.success) {
        error = authData.error;
        return;
      }

      // Store user info from verified response
      user.set(authData.user);
      
      // Use SvelteKit navigation
      await goto("/", { invalidateAll: true });
    } catch (err) {
      error = "Authentication failed. Please try again.";
      console.error(err);
    }
  }

  // Add a function to handle image loading
  function handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (!imgElement.dataset.retried) {
      // Try once with a different size
      imgElement.dataset.retried = "true";
      imgElement.src = `${imgElement.src.split("?")[0]}?sz=64`;
    } else {
      // If retry failed, use default avatar
      imgElement.src =
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
      imgElement.onerror = null; // Prevent further retries
    }
  }

  onMount(async () => {
    try {
      await initializeGoogleAuth();
    } catch (err) {
      error = "Failed to initialize Google authentication.";
      console.error(err);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Login - SvelteKit App</title>
  <meta name="description" content="Login page" />
  <script src="https://accounts.google.com/gsi/client?version=1"></script>
</svelte:head>

<section
  class="w-full min-h-screen bg-gray-50 flex justify-center items-center"
>
  <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
    

    {#if data}
	  Current Data
		
      <pre class='bg-gray-50 mb-5 mt-3'>{JSON.stringify(data, null, 2)}</pre>
    {/if}

    {#if loading}
      <div class="text-center">Loading...</div>
    {:else if $user}
      <div class="text-center">
        <img
          src={$user.picture}
          alt={$user.name}
          class="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
          on:error={handleImageError}
          loading="lazy"
          crossorigin="anonymous"
        />
        <p class="font-medium">Welcome, {$user.name}!</p>
        <p class="text-sm text-gray-600">{$user.email}</p>
      </div>
    {:else}
      {#if error}
        <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {error}
        </div>
      {/if}

      {#if !googleScriptLoaded}
        <div class="text-yellow-600 mb-4 text-center">
          Waiting for Google script to load...
        </div>
      {/if}

      <div id="googleButton" class="flex justify-center">
        {#if !googleScriptLoaded}
          <div class="text-gray-500">Loading login button...</div>
        {/if}
      </div>
    {/if}
  </div>
</section>
