<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { user } from '$lib/stores/auth';
  import type { GoogleUser, SpreadsheetRow } from '$lib/types';

  let loading = true;
  let error: string | null = null;
  
  const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6hmCR_BMArUDnOpmc3ir3dGS3VQ4uBNaSOhuNFuuo_VUQgS-ovKYgGlNuJjs4Eq61ddNkECz-bynp/pub?gid=0&single=true&output=csv";

  let googleScriptLoaded = false;

  async function initializeGoogleAuth() {
    const clientId = "382380825029-rnd0cj6b98nvf2ctd3kceohfjvo3m7ia.apps.googleusercontent.com";
    
    return new Promise<void>((resolve) => {
      if (!window.google || !window.google.accounts) {
        console.error('Google Identity Services not loaded');
        error = "Google authentication services failed to load";
        return;
      }
      
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
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
              width: 250
            });
          } else {
            console.error('Google button element not found');
            error = "Failed to render login button";
          }
        }, 100);

        googleScriptLoaded = true;
      } catch (err) {
        console.error('Error initializing Google Auth:', err);
        error = "Failed to initialize Google authentication";
      }
      
      resolve();
    });
  }

  async function handleCredentialResponse(response: any) {
    try {
      // Decode the JWT token
      const token = response.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const { email, name, picture } = JSON.parse(jsonPayload);
      
      // Check if user exists in spreadsheet
      const data = await d3.csv<SpreadsheetRow>(SPREADSHEET_URL);
      const userRow = data.find(row => row.email === email);

      if (!userRow) {
        error = "Access denied. Your email is not authorized.";
        return;
      }

      // Modify the picture URL to use a specific size and remove any existing parameters
      const baseUrl = picture.split('?')[0];
      const modifiedPicture = `${baseUrl}?sz=96`; // Use a specific size parameter

      // Store user info with modified picture URL
      user.set({ 
        email, 
        name, 
        picture: modifiedPicture
      });
      
      // Log the user's data
      console.log("User's data link:", userRow.dataLink);
      
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
      imgElement.dataset.retried = 'true';
      imgElement.src = `${imgElement.src.split('?')[0]}?sz=64`;
    } else {
      // If retry failed, use default avatar
      imgElement.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
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

<section class="w-full min-h-screen bg-gray-50 flex justify-center items-center">
  <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
    <h1 class="text-2xl font-bold mb-6 text-center">Hi, please login</h1>
    
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
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      {/if}
      
      {#if !googleScriptLoaded}
        <div class="text-yellow-600 mb-4 text-center">
          Waiting for Google script to load...
        </div>
      {/if}
      
      <div 
        id="googleButton" 
        class="flex justify-center"
      >
        {#if !googleScriptLoaded}
          <div class="text-gray-500">Loading login button...</div>
        {/if}
      </div>
    {/if}
  </div>
</section>
