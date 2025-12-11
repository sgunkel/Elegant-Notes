<script>
import LoginView from '@/components/Views/LoginView.vue';
import RegisterUserView from '@/components/Views/RegisterUserView.vue';

export default {
    components: {
        LoginView,
        RegisterUserView,
    },
    data() {
        return {
            showLoginView: true,
        }
    }
}
</script>

<template>
    <div class="ap-wrapper">
        <LoginView v-if="this.showLoginView"></LoginView>
        <RegisterUserView v-else></RegisterUserView>
        
        <div v-if="this.showLoginView"
          class="registration-btn"
          @click="this.showLoginView = false">
            Create a new account
        </div>
        <div v-else
          class="login-btn"
          @click="this.showLoginView = true">
            login
        </div>
    </div>
</template>

<style>
.ap-wrapper {
    padding: 0;
}

.registration-btn,
.login-btn {
    padding: 0;
}
</style>
