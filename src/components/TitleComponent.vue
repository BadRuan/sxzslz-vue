<template>
    <div class="flex items-center py-4">
        <span class="h-5 w-1 rounded bg-primary mr-4"></span>
        <div>
            <p class="text-xs text-gray-500">
                <slot name="second"></slot>
            </p>
            <h2 class="text-lg font-semibold text-gray-900">
                <slot name="first"></slot>
            </h2>
        </div>
    </div>
</template>