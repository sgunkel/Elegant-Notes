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
    <LoginView v-if="this.showLoginView"></LoginView>
    <RegisterUserView v-else></RegisterUserView>
    
    <div v-if="this.showLoginView" @click="this.showLoginView = false">Create a new account</div>
    <div v-else @click="this.showLoginView = true">login</div>
</template>

<style>

</style>
