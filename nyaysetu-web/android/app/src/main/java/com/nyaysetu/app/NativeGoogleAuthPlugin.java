package com.nyaysetu.app;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private GoogleSignInClient mGoogleSignInClient;

    @Override
    public void load() {
        String serverClientId = "611241590650-in5gn85q6nmn1g7kctd6vp08udgume1b.apps.googleusercontent.com";
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(serverClientId)
                .requestEmail()
                .requestProfile()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        mGoogleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            startActivityForResult(call, signInIntent, "googleSignInCallback");
        });
    }

    @ActivityCallback
    private void googleSignInCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("idToken", account.getIdToken());
                ret.put("email", account.getEmail());
                ret.put("name", account.getDisplayName());
                ret.put("id", account.getId());
                call.resolve(ret);
            } else {
                call.reject("Google account is null");
            }
        } catch (ApiException e) {
            call.reject("Google sign in failed with status code: " + e.getStatusCode());
        }
    }
}
