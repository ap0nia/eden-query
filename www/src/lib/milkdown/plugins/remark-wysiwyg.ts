import { $remark } from '@milkdown/kit/utils'

import { remarkWysiwyg as remarkWysiwygImplementation } from '$lib/unified/remark-wysiwyg'

export const remarkWysiwyg = $remark('remark-wysiwyg', () => remarkWysiwygImplementation)
