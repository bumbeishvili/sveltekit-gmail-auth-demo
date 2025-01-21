<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { user } from "$lib/stores/auth";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";

  let allData = {};
  export let data: PageData;

  let loading = true;
  let error: string | null = null;

  let googleScriptLoaded = false;

  // Log when data changes
  $: {
    if (data.userDetails) {
      console.log("User Details Received:", data.userDetails);
      allData = {
        ...allData,
        email: data.userDetails.email,
        name: data.userDetails.name,
        picture: data.userDetails.picture,
        dataLink: data.userDetails.dataLink,
      };
      console.log("Updated allData:", allData);
    }
  }

  let finalData = [];

  $: {
    console.log("all data changed", { allData });
    if (allData.dataLink) {
      d3.csv(allData.dataLink).then((data) => {
        console.log("Data Loaded:", data);
        finalData = data;
      });
    }
  }

  async function initializeGoogleAuth() {
    console.log("Initializing Google Auth");
    const clientId =
      "382380825029-rnd0cj6b98nvf2ctd3kceohfjvo3m7ia.apps.googleusercontent.com";

    return new Promise<void>((resolve) => {
      console.log("Checking Google Identity Services");
      if (!window.google || !window.google.accounts) {
        console.log("Google Identity Services not loaded");
        error = "Google authentication services failed to load";
        return;
      }

      try {
        console.log("Initializing Google Accounts");
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: "popup",
        });

        setTimeout(() => {
          console.log("Attempting to render Google Button");
          const buttonElement = document.getElementById("googleButton");
          if (buttonElement) {
            console.log("Google Button Element Found");
            window.google.accounts.id.renderButton(buttonElement, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 250,
            });
            googleScriptLoaded = true;
            console.log("Google Button Rendered");
          } else {
            console.log("Google button element not found");
            error = "Failed to render login button";
          }
        }, 100);
      } catch (err) {
        console.log("Error initializing Google Auth:", err);
        error = "Failed to initialize Google authentication";
      }

      resolve();
    });
  }

  async function handleCredentialResponse(response: any) {
    console.log("Credential Response Received:", response);
    try {
      const token = response.credential;
      console.log("Decoding JWT Token");
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const { email, name, picture } = JSON.parse(jsonPayload);
      console.log("Decoded Payload:", { email, name, picture });

      allData = {
        ...allData,
        email: email || allData.email,
        name: name || allData.name,
        picture: picture || allData.picture,
        token: token || allData.token,
      };

      console.log("Updated allData after credential response:", allData);

      console.log("Sending Auth Request to Server");
      const authResponse = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, picture, token }),
      });

      const authData = await authResponse.json();
      console.log("Auth Response:", authData);

      if (!authData.success) {
        console.log("Auth Failed:", authData.error);
        error = authData.error;
        return;
      }

      // Modify the picture URL
      const baseUrl = picture.split("?")[0];
      const modifiedPicture = `${baseUrl}?sz=96`;
      console.log("Modified Picture URL:", modifiedPicture);

      // Store user info in client-side store, including token
      user.set({
        email,
        name,
        picture: modifiedPicture,
        token,
      });
      console.log("User Store Updated");
      goto("/", { invalidateAll: true });
    } catch (err) {
      console.log("Authentication Error:", err);
      error = "Authentication failed. Please try again.";
    }
  }

  function handleImageError(event: Event) {
    console.log("Image Error Event:", event);
    const imgElement = event.target as HTMLImageElement;
    if (!imgElement.dataset.retried) {
      console.log(
        "First image load attempt failed, retrying with different size"
      );
      imgElement.dataset.retried = "true";
      imgElement.src = `${imgElement.src.split("?")[0]}?sz=64`;
    } else {
      console.log("Image load retry failed, using default avatar");
      imgElement.src =
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
      imgElement.onerror = null;
    }
  }

  onMount(async () => {
    console.log("Component Mounted");
    try {
      await initializeGoogleAuth();
    } catch (err) {
      console.log("Google Auth Initialization Error:", err);
      error = "Failed to initialize Google authentication.";
    } finally {
      loading = false;
      console.log("Loading Complete");
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
    <pre>{JSON.stringify({ allData, finalData }, null, 2)} </pre>

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
