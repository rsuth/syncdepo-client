<script>
	import ApplicationHome from "./ApplicationHome.svelte";
	import Loading from "./Loading.svelte";
	import JobsTable from "./JobsTable.svelte";
	import Login from "./Login.svelte";
	import NewSync from "./NewSync.svelte";
	import NoInternet from "./NoInternet.svelte";
	import Account from "./Account.svelte";
	import Editor from "./Editor.svelte";
	import { AccessToken, RefreshToken, footerMessage } from "./stores.js";
	import { fetchWithToken } from "./utils";
	import {
		AUTH_SERVER_BASE_URL,
		API_SERVER_BASE_URL,
		STATUS_POLL_SECONDS,
	} from "./config";

	let page;
	let currentlyOpenSync;
	let currentUser;
	let connectionError = "";
	let currentOpenFilePath;
	let connectionStatus = "";
	$: {
		if (page) {
			footerMessage.set("");
		}
	}

	const pollAPI = () => {
		fetch(`${API_SERVER_BASE_URL}/status`)
			.then((response) => {
				if (response.status === 200) {
					connectionStatus = "🟢 Connected to Sync Server";
				}
			})
			.catch((err) => {
				console.log(err);
				connectionStatus = "🔴 No Connection to Sync Server";
			});
		setTimeout(pollAPI, STATUS_POLL_SECONDS * 1000);
	};

	const retrieveLocalTokens = async () => {
		try {
			let accessToken = await window.api.GetAccessToken();
			let refreshToken = await window.api.GetRefreshToken();

			if (!refreshToken) {
				page = Login;
				return {
					success: false,
					error: { message: "No refresh token" },
				};
			}

			AccessToken.set(accessToken);
			RefreshToken.set(refreshToken);

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, error: { message: "No tokens found" } };
		}
	};

	const getCurrentUser = async () => {
		let user = await fetchWithToken(`${AUTH_SERVER_BASE_URL}/user`, "GET");
		if (user.error) {
			return { success: false, error: user.error };
		}
		currentUser = user;
		return { success: true };
	};

	const init = async () => {
		pollAPI(3000);
		try {
			page = Loading;
			let tokens = await retrieveLocalTokens();

			AccessToken.subscribe((token) => {
				window.api.SetAccessToken(token);
			});

			RefreshToken.subscribe((token) => {
				window.api.SetRefreshToken(token);
			});

			if (!tokens.success) {
				page = Login;
				return;
			}

			let user = await getCurrentUser();
			if (!user.success) {
				page = Login;
				return;
			}
		} catch (err) {
			console.log(err);
			page = NoInternet;
		}
		page = ApplicationHome;
	};

	const handleLoadSyncFile = async (event) => {
		try {
			currentlyOpenSync = await window.api.LoadSyncFile(event.detail.path);
			currentOpenFilePath = event.detail.path;
			page = Editor;
		} catch (error) {
			console.log(error);
		}
	};

	const handleOpenSyncFile = () => {
		window.api.OpenSyncFileDialog().then((p) => {
			if (p) {
				handleLoadSyncFile({ detail: { path: p[0] } });
			}
		});
	};

	const handleLogOut = () => {
		AccessToken.set(undefined);
		RefreshToken.set(undefined);
		currentUser = undefined;
		page = Login;
	};

	init();
</script>

<div id="app" class="fill">
	{#if page !== Login && page !== Loading}
		<div
			id="top-bar"
			class="d-flex justify-content-end flex-row-reverse"
			style="height: 60px;"
		>
			{#if currentUser}
				<button
					on:click={async () => {
						footerMessage.set("Retrieving user account...");
						let user = await getCurrentUser();
						if (user.error) {
							page = Login;
						} else {
							page = Account;
						}
					}}
					class="btn ms-auto me-3 my-2 justify-self"
					id="login-box"
				>
					<img width="20px" src="user-icon.png" alt="user icon" />
					{currentUser.email}
				</button>
			{:else}
				<button
					on:click={() => {
						page = Login;
					}}
					class="btn ms-auto me-3 my-2 justify-self"
					id="login-box"
				>
					Log in
				</button>
			{/if}
			{#if page !== ApplicationHome}
				<button
					class="btn my-2"
					on:click={() => {
						window.api.QuitApplication();
					}}
					><img src="exit.png" alt="x" width="20px" />
					Quit
				</button>
				<button
					class="btn my-2"
					on:click={() => {
						page = JobsTable;
					}}
					disabled={!currentUser}
				>
					<img src="q.png" alt="list" width="20px" />
					My Sync Queue
				</button>
				<button class="btn my-2" on:click={handleOpenSyncFile}>
					<img src="folder.svg" alt="folder" width="20px" />
					Open Sync File</button
				>
				<button
					class="btn my-2"
					on:click={() => {
						page = NewSync;
					}}
					disabled={!currentUser}
				>
					<img src="plus.png" alt="new" width="20px" />
					New Sync
				</button>
				<button
					class="btn my-2 ms-1"
					on:click={() => {
						page = ApplicationHome;
					}}
				>
					<img src="home-circle.png" alt="home" width="20px" />
					Home
				</button>
			{/if}
		</div>
	{/if}
	<main>
		<svelte:component
			this={page}
			{currentlyOpenSync}
			{currentOpenFilePath}
			{currentUser}
			{connectionError}
			on:goto-jobs-table={() => {
				page = JobsTable;
			}}
			on:goto-new-sync={() => {
				page = NewSync;
			}}
			on:goto-account={() => {
				page = Account;
			}}
			on:goto-home={() => {
				page = ApplicationHome;
			}}
			on:goto-login={() => {
				page = Login;
			}}
			on:login-success={async () => {
				page = Loading;
				let user = await getCurrentUser();
				if (user.error) {
					page = Login;
				} else {
					page = ApplicationHome;
				}
			}}
			on:goto-loading={() => {
				page = Loading;
			}}
			on:load-sync={handleLoadSyncFile}
			on:open-sync-file={handleOpenSyncFile}
			on:logout={handleLogOut}
			on:use-offline={() => {
				page = ApplicationHome;
			}}
		/>
	</main>
	{#if page !== Login && page !== Loading}
		<footer>
			<div class="footer-msg">{$footerMessage}</div>
			<div class="me-2">{connectionStatus}</div>
		</footer>
	{/if}
</div>

<style>
	main {
		height: calc(100vh - 90px);
	}
	.fill {
		min-height: 100%;
		height: 100%;
	}
	#top-bar {
		background-color: #22223b;
		color: #fffbff;
		line-height: 60px;
		/* background-color: #405261 */
	}
	footer {
		display: flex;
		justify-content: space-between;
		height: 30px;
		line-height: 30px;
		background-color: #22223b;
		color: #dbdadb;
		font-size: 10px;
		/* background-color: #405261 */
	}
	.footer-msg {
		margin-left: 20px;
	}
	.btn {
		color: #fffbff;
	}
	.btn:hover {
		color: #4d9de0;
	}

	img {
		vertical-align: text-top;
	}
</style>
