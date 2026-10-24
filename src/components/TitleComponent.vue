<template>
    <div class="flex items-center gap-4">
        <span class="h-7 w-1 rounded-full bg-primary-500"></span>
        <div>
            <p class="text-xs tracking-[0.18em] text-gray-400 uppercase">
                <slot name="second"></slot>
            </p>
            <h2 class="mt-1 text-xl font-semibold text-foreground">
                <slot name="first"></slot>
            </h2>
        </div>
    </div>
</template>
