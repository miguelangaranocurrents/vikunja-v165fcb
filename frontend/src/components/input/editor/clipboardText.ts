import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

function serializeInline(node: ProseMirrorNode): string {
	let out = ''
	node.forEach(child => {
		if (child.isText) {
			out += child.text ?? ''
		} else if (child.type.name === 'hardBreak') {
			out += '\n'
		} else {
			out += child.textContent
		}
	})
	return out
}

function indent(text: string, prefix: string): string {
	return text.split('\n').map((line, i) => i === 0 ? line : prefix + line).join('\n')
}

function serializeList(list: ProseMirrorNode): string {
	const start = list.type.name === 'orderedList' ? Number(list.attrs.start ?? 1) : 0
	const items: string[] = []
	list.forEach((item, _offset, index) => {
		let marker = '- '
		if (list.type.name === 'orderedList') {
			marker = `${start + index}. `
		} else if (item.type.name === 'taskItem') {
			marker = item.attrs.checked ? '- [x] ' : '- [ ] '
		}
		items.push(marker + indent(serializeFragment(item.content, '\n'), ' '.repeat(marker.length)))
	})
	return items.join('\n')
}

function serializeNode(node: ProseMirrorNode): string {
	switch (node.type.name) {
		case 'bulletList':
		case 'orderedList':
		case 'taskList':
			return serializeList(node)
	}

	if (node.isTextblock) {
		return serializeInline(node)
	}

	if (node.isLeaf) {
		return node.textContent
	}

	return serializeFragment(node.content, '\n\n')
}

function serializeFragment(fragment: Fragment, separator: string): string {
	const parts: string[] = []
	fragment.forEach(child => parts.push(serializeNode(child)))
	return parts.join(separator)
}

/**
 * Plain text for the clipboard that keeps list markers (ProseMirror's default drops them).
 */
export function serializeSliceAsText(slice: Slice): string {
	return serializeFragment(slice.content, '\n\n')
}
