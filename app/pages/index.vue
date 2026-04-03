<template>
	<UContainer class="py-10 max-w-5xl">
		<div class="space-y-6">
			<header class="space-y-2">
				<h1 class="text-3xl font-semibold tracking-tight">Unicode Inspector</h1>
				<p class="text-sm text-gray-500">Upload files, review suspicious Unicode characters, and download cleaned copies.</p>
			</header>

			<UCard>
				<template #header>
					<div class="flex items-center gap-2">
						<UIcon name="i-lucide-upload" class="size-5" />
						<span>Upload and rules</span>
					</div>
				</template>

				<div class="space-y-4">
					<UFileUpload v-model="uploadedFiles" multiple accept="*" />

					<div class="flex flex-wrap gap-4">
						<UCheckbox v-model="ignoreEnglishAlphabetic" label="Ignore English letters" />
						<UCheckbox v-model="ignoreNumbers" label="Ignore numeric" />
						<UCheckbox v-model="ignoreNewlines" label="Ignore newlines" />
						<UCheckbox v-model="ignoreSpaces" label="Ignore spaces" />
						<UCheckbox v-model="ignoreTabs" label="Ignore tabs" />
					</div>

					<UAlert color="neutral" variant="soft" icon="i-lucide-info" title="Default scan rules">
						English letters, numeric, spaces, tabs, and newlines are ignored by default.
					</UAlert>
				</div>
			</UCard>

			<UAlert v-if="files.length" color="neutral" variant="soft" icon="i-lucide-scan-search" title="Scan summary">
				{{ summary.fileCount }} file(s), {{ summary.filesWithIssues }} with suspicious characters, {{ summary.issueCount }} total match(es).
			</UAlert>

			<div v-if="files.length" class="space-y-4">
				<UCard v-for="file in files" :key="file.id">
					<template #header>
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-medium">{{ file.name }}</p>
								<p class="text-xs text-gray-500">{{ file.characters.length }} character(s) scanned</p>
							</div>

							<div class="flex flex-wrap items-center gap-2">
								<UBadge :color="file.issues.length ? 'error' : 'success'" variant="soft">
									{{ file.issues.length ? `${file.issues.length} issue(s)` : "Clean" }}
								</UBadge>
								<UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-download" @click="downloadFile(file)">
									Download cleaned
								</UButton>
								<UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="removeFile(file.id)"> Remove </UButton>
							</div>
						</div>
					</template>

					<div v-if="file.issues.length" class="space-y-3">
						<UAlert color="error" variant="soft" icon="i-lucide-alert-triangle" title="Suspicious characters found">
							{{ file.issues.length }} character(s) are not ignored by the current rules.
						</UAlert>

						<div class="overflow-x-auto">
							<table class="w-full text-left text-sm">
								<thead>
									<tr class="border-b text-xs uppercase tracking-wide text-gray-500">
										<th class="py-2 pr-4">Index</th>
										<th class="py-2 pr-4">Character</th>
										<th class="py-2 pr-4">Code point</th>
										<th class="py-2">Notes</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="issue in file.issues" :key="`${file.id}-${issue.index}`" class="border-b last:border-b-0">
										<td class="py-2 pr-4 align-top">{{ issue.index }}</td>
										<td class="py-2 pr-4 align-top font-mono">{{ issue.preview }}</td>
										<td class="py-2 pr-4 align-top font-mono">U+{{ issue.codePoint }}</td>
										<td class="py-2 align-top text-gray-500">{{ issue.label }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<UAlert v-else color="success" variant="soft" icon="i-lucide-check-circle" title="No suspicious characters">
						This file does not contain any Unicode characters that match the current scan rules.
					</UAlert>
				</UCard>
			</div>

			<UCard v-else>
				<div class="flex items-center gap-3 text-sm text-gray-500">
					<UIcon name="i-lucide-file-search" class="size-5" />
					<p>Upload one or more files to start scanning.</p>
				</div>
			</UCard>
		</div>
	</UContainer>
</template>

<script setup lang="ts">
type FileIssue = {
	index: number
	preview: string
	codePoint: string
	label: string
}

type TrackedFile = {
	id: string
	name: string
	content: string
	characters: string[]
	issues: FileIssue[]
	cleanedContent: string
}

const files = ref<TrackedFile[]>([])
const uploadedFiles = ref<File[]>([])
const ignoreEnglishAlphabetic = ref(true)
const ignoreNumbers = ref(true)
const ignoreNewlines = ref(true)
const ignoreSpaces = ref(true)
const ignoreTabs = ref(true)

const isEnglishAlphabetic = (char: string) => /^[A-Za-z]$/.test(char)
const isNumeric = (char: string) => /^\p{N}$/u.test(char)
const isNewline = (char: string) => char === "\n" || char === "\r"

const formatPreview = (char: string) => {
	if (char === " ") return "space"
	if (char === "\n") return "\\n"
	if (char === "\r") return "\\r"
	if (char === "\t") return "\\t"
	if (char.trim() === "") return "whitespace"

	return char
}

const formatCodePoint = (char: string) => {
	const codePoint = char.codePointAt(0)
	if (codePoint === undefined) return "0000"

	return codePoint.toString(16).toUpperCase().padStart(4, "0")
}

const isSuspicious = (char: string) => {
	// If it matches a known type, check if that type's ignore rule is enabled
	if (isEnglishAlphabetic(char)) return !ignoreEnglishAlphabetic.value
	if (isNumeric(char)) return !ignoreNumbers.value
	if (isNewline(char)) return !ignoreNewlines.value
	if (char === " ") return !ignoreSpaces.value
	if (char === "\t") return !ignoreTabs.value

	// For other ASCII characters, not suspicious
	const codePoint = char.codePointAt(0)
	if (codePoint === undefined || (32 <= codePoint && codePoint <= 127)) return false

	// For non-ASCII, suspicious
	return true
}

const scanFile = (name: string, content: string, id: string): TrackedFile => {
	const characters = [...content]
	const issues: FileIssue[] = []
	const cleanedCharacters: string[] = []

	characters.forEach((char, index) => {
		if (isSuspicious(char)) {
			issues.push({
				index,
				preview: formatPreview(char),
				codePoint: formatCodePoint(char),
				label: "Not ignored by the current rules",
			})
			return
		}

		cleanedCharacters.push(char)
	})

	return {
		id,
		name,
		content,
		characters,
		issues,
		cleanedContent: cleanedCharacters.join(""),
	}
}

const refreshFiles = () => {
	files.value = files.value.map((file) => scanFile(file.name, file.content, file.id))
}

const handleFiles = async (fileArray: File[]) => {
	if (!fileArray?.length) return

	const selectedFiles = await Promise.all(
		fileArray.map(async (file) => {
			const content = await file.text()
			const id = `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`

			return scanFile(file.name, content, id)
		}),
	)

	files.value = [...files.value, ...selectedFiles]
	uploadedFiles.value = []
}

const removeFile = (id: string) => {
	files.value = files.value.filter((file) => file.id !== id)
}

const downloadFile = (file: TrackedFile) => {
	const blob = new Blob([file.cleanedContent], { type: "text/plain;charset=utf-8" })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = `cleaned-${file.name}`
	anchor.click()
	URL.revokeObjectURL(url)
}

const summary = computed(() => {
	const issueCount = files.value.reduce((total, file) => total + file.issues.length, 0)

	return {
		fileCount: files.value.length,
		filesWithIssues: files.value.filter((file) => file.issues.length > 0).length,
		issueCount,
	}
})

watch([ignoreEnglishAlphabetic, ignoreNumbers, ignoreNewlines, ignoreSpaces, ignoreTabs], refreshFiles)

watch(uploadedFiles, (newFiles) => {
	if (newFiles?.length) {
		handleFiles(newFiles)
	}
})
</script>
