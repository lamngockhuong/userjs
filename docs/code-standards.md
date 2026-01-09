# Code Standards: UserJS Vue Userscript Manager

## General Principles
- Follow Vue 3 Composition API best practices
- Use TypeScript for type safety
- Prioritize readability and maintainability
- Keep components and composables focused and single-responsibility

## Naming Conventions
- Components: PascalCase (e.g., `ScriptCard`)
- Composables: camelCase with 'use' prefix (e.g., `useScripts`)
- Props: camelCase
- Events: kebab-case
- CSS classes: kebab-case

## Composable Design
- Return reactive or computed values
- Handle error states explicitly
- Provide clear type definitions
- Minimize side effects
- Use `ref()` and `reactive()` appropriately

## Component Structure
- Use `<script setup>` syntax
- Define props with `defineProps()`
- Use `defineEmits()` for event emissions
- Keep template logic minimal
- Extract complex logic to composables

## Error Handling
- Provide user-friendly error messages
- Log errors for debugging
- Implement fallback states
- Use try/catch in async operations

## Accessibility
- Follow WCAG 2.1 guidelines
- Use semantic HTML
- Provide proper aria attributes
- Ensure keyboard navigation
- Support color contrast requirements

## Performance
- Use `v-once` for static content
- Implement lazy loading
- Minimize re-renders
- Use `computed` and `watch` efficiently
