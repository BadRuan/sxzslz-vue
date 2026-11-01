<template>
    <div class="flex items-center gap-4">
        <span class="h-7 w-1 rounded-full bg-primary"></span>
        <div>
            <p class="text-xs text-base-content/60">
                <slot name="second"></slot>
            </p>
            <h2 class="mt-1 text-xl font-semibold tracking-tight text-base-content">
                <slot name="first"></slot>
            </h2>
        </div>
    </div>
</template>
