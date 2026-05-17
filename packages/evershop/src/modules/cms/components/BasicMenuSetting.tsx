import Spinner from '@components/admin/Spinner.js';
import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle
} from '@components/common/ui/Dialog.js';
import { Input } from '@components/common/ui/Input.js';
import { Item, ItemContent } from '@components/common/ui/Item.js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import CreatableSelect from 'react-select/creatable';
import uniqid from 'uniqid';
import { useQuery } from 'urql';
import './BasicMenuSetting.scss';

const menuQuery = `
  query Query ($filters: [FilterInput]) {
    categories (filters: $filters) {
      items {
        value: uuid,
        label: name
        path {
          name
        }
      }
    }
    cmsPages (filters: $filters) {
      items {
        value: uuid,
        label: name
      }
    }
  }
`;

interface MenuItem {
  id: string;
  name: string;
  url: string;
  type: string;
  uuid: string;
  children: MenuItem[];
}

/* ── Edit popup ──────────────────────────────────────────── */
const MenuSettingPopup: React.FC<{
  item: MenuItem;
  updateItem: (item: MenuItem) => void;
}> = ({ item, updateItem }) => {
  const [currentItem, setCurrentItem] = React.useState(item);
  const [err, setErr] = React.useState<string | null>(null);

  const [result] = useQuery({
    query: menuQuery,
    variables: { filters: [] }
  });
  const { data, fetching, error } = result;

  if (fetching) {
    return (
      <Item variant={'outline'}>
        <ItemContent>
          <Spinner width={25} height={25} />
        </ItemContent>
      </Item>
    );
  }
  if (error) {
    return (
      <Item variant={'outline'}>
        <ItemContent>
          <div className="text-destructive">{error.message}</div>
        </ItemContent>
      </Item>
    );
  }

  const groupOptions = [
    {
      label: 'Catégories',
      options: data.categories.items.map((i) => ({
        ...i,
        label: i.path.map((p) => p.name).join(' > ')
      }))
    },
    {
      label: 'Pages CMS',
      options: data.cmsPages.items
    },
    {
      label: 'Personnalisé',
      options:
        currentItem.type === 'custom'
          ? [{ value: currentItem.uuid, label: currentItem.uuid }]
          : []
    }
  ];

  const handleCreate = (inputValue) => {
    setCurrentItem({
      ...item,
      uuid: inputValue,
      name: inputValue,
      url: inputValue,
      type: 'custom'
    });
  };

  return (
    <div className="grid grid-flow-row gap-5">
      <div>
        <Input
          id="menuName"
          type="text"
          value={currentItem.name}
          placeholder="Nom du menu"
          onChange={(e) =>
            setCurrentItem({ ...currentItem, name: e.target.value })
          }
          className="w-full"
        />
      </div>
      <div>
        <CreatableSelect
          isClearable
          onChange={(newValue: {
            value: string;
            label: string;
            __typename?: string;
          }) => {
            setCurrentItem({
              ...currentItem,
              uuid: newValue?.value || '',
              name: newValue?.label || '',
              type: newValue?.__typename === 'Category' ? 'category' : 'page'
            });
          }}
          onCreateOption={handleCreate}
          options={groupOptions}
          value={{
            value: currentItem.uuid,
            label:
              currentItem.type === 'custom'
                ? currentItem.uuid
                : [...groupOptions[0].options, ...groupOptions[1].options].find(
                    (option) => option.value === currentItem.uuid
                  )?.label || ''
          }}
        />
      </div>
      {err && <div className="text-destructive">{err}</div>}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (currentItem.uuid === '') {
              setErr('Veuillez sélectionner un élément de menu');
              return;
            }
            if (currentItem.name === '') {
              setErr('Veuillez saisir un nom');
              return;
            }
            updateItem(currentItem);
          }}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

/* ── Sortable item (used at every depth) ─────────────────── */
interface SortableMenuItemProps {
  item: MenuItem;
  updateItem: (item: MenuItem) => void;
  deleteItem: (item: MenuItem) => void;
  depth?: number;
  sensors: ReturnType<typeof useSensors>;
}

const SortableMenuItem: React.FC<SortableMenuItemProps> = ({
  item,
  updateItem,
  deleteItem,
  depth = 0,
  sensors
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [itemInEdit, setItemInEdit] = React.useState(item);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const addChild = (child: MenuItem) => {
    updateItem({
      ...item,
      children: [...(item.children || []), child]
    });
  };

  const updateItemFunc = (edited: MenuItem) => {
    if (edited.id === item.id) {
      updateItem(edited);
    } else {
      // It's a new child being added
      addChild(edited);
    }
    setDialogOpen(false);
  };

  /* Recursive update/delete helpers for children at any depth */
  const updateChildDeep = (target: MenuItem) => {
    const recurse = (list: MenuItem[]): MenuItem[] =>
      list.map((i) => {
        if (i.id === target.id) return target;
        if (i.children && i.children.length > 0) {
          return { ...i, children: recurse(i.children) };
        }
        return i;
      });
    updateItem({ ...item, children: recurse(item.children || []) });
  };

  const deleteChildDeep = (target: MenuItem) => {
    const recurse = (list: MenuItem[]): MenuItem[] =>
      list
        .filter((i) => i.id !== target.id)
        .map((i) => {
          if (i.children && i.children.length > 0) {
            return { ...i, children: recurse(i.children) };
          }
          return i;
        });
    updateItem({ ...item, children: recurse(item.children || []) });
  };

  const handleChildDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const children = item.children || [];
    const oldIndex = children.findIndex((c) => c.id === active.id);
    const newIndex = children.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    updateItem({
      ...item,
      children: arrayMove(children, oldIndex, newIndex)
    });
  };

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className="flex justify-between py-2 px-2 bg-white border border-border rounded mb-2"
      >
        <div className="flex justify-start gap-3 items-center">
          <button
            type="button"
            className="cursor-move p-1"
            {...attributes}
            {...listeners}
          >
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="#949494"
              width={20}
              height={20}
            >
              <g>
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                  fillRule="nonzero"
                  d="M14 6h2v2h5a1 1 0 0 1 1 1v7.5L16 13l.036 8.062 2.223-2.15L20.041 22H9a1 1 0 0 1-1-1v-5H6v-2h2V9a1 1 0 0 1 1-1h5V6zm8 11.338V21a1 1 0 0 1-.048.307l-1.96-3.394L22 17.338zM4 14v2H2v-2h2zm0-4v2H2v-2h2zm0-4v2H2V6h2zm0-4v2H2V2h2zm4 0v2H6V2h2zm4 0v2h-2V2h2zm4 0v2h-2V2h2z"
                />
              </g>
            </svg>
          </button>
          <div>{item.name}</div>
        </div>
        <div className="flex justify-end gap-3 items-center">
          <Button
            variant={'outline'}
            onClick={() => {
              setItemInEdit(item);
              setDialogOpen(true);
            }}
            size={'sm'}
          >
            Modifier
          </Button>
          <Button
            variant={'outline'}
            onClick={() => {
              setItemInEdit({
                id: uniqid(),
                name: '',
                url: '',
                type: 'category',
                uuid: '',
                children: []
              });
              setDialogOpen(true);
            }}
            size={'sm'}
          >
            Ajouter un enfant
          </Button>
          <Button variant={'destructive'} onClick={() => deleteItem(item)}>
            Supprimer
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{`Modifier l'élément : ${itemInEdit.name}`}</DialogTitle>
            </DialogHeader>
            <MenuSettingPopup item={itemInEdit} updateItem={updateItemFunc} />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Render children recursively ─────────────────── */}
      {item.children && item.children.length > 0 && (
        <div className="ml-5 mt-1 mb-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChildDragEnd}
          >
            <SortableContext
              items={item.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {item.children.map((child) => (
                  <SortableMenuItem
                    key={child.id}
                    item={child}
                    updateItem={updateChildDeep}
                    deleteItem={deleteChildDeep}
                    depth={depth + 1}
                    sensors={sensors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

/* ── Main setting component ──────────────────────────────── */
interface BasicMenuSettingProps {
  basicMenuWidget: {
    menus: MenuItem[];
    isMain: boolean;
    className: string;
  };
}

export default function BasicMenuSetting({
  basicMenuWidget: { menus, isMain, className }
}: BasicMenuSettingProps) {
  const { register, setValue } = useFormContext();
  const [items, setItems] = React.useState(menus);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  /* Recursive update/delete for top-level items and all descendants */
  const updateItem = (target: MenuItem) => {
    setItems((prev) => {
      const recurse = (list: MenuItem[]): MenuItem[] =>
        list.map((i) => {
          if (i.id === target.id) return target;
          if (i.children && i.children.length > 0) {
            return { ...i, children: recurse(i.children) };
          }
          return i;
        });
      return recurse(prev);
    });
  };

  const deleteItem = (target: MenuItem) => {
    setItems((prev) => {
      const recurse = (list: MenuItem[]): MenuItem[] =>
        list
          .filter((i) => i.id !== target.id)
          .map((i) => {
            if (i.children && i.children.length > 0) {
              return { ...i, children: recurse(i.children) };
            }
            return i;
          });
      return recurse(prev);
    });
  };

  useEffect(() => {
    setValue('settings.menus', items);
  }, [items]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((menu) => (
              <SortableMenuItem
                key={menu.id}
                item={menu}
                updateItem={updateItem}
                deleteItem={deleteItem}
                depth={0}
                sensors={sensors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <input
        type="hidden"
        {...register('settings.menus')}
        value={JSON.stringify(items)}
      />
      <div className="space-y-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button variant={'outline'} size={'sm'}>
              Ajouter un élément
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un élément</DialogTitle>
            </DialogHeader>
            <MenuSettingPopup
              item={{
                id: uniqid(),
                name: '',
                url: '',
                type: 'category',
                uuid: '',
                children: []
              }}
              updateItem={(item) => {
                setItems((prevItems) => [...prevItems, item]);
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <div>
          <CheckboxField
            label="Menu principal ?"
            name="settings.isMain"
            defaultValue={isMain}
          />
        </div>
        <div>
          <InputField
            label="Classes CSS personnalisées"
            name="settings.className"
            defaultValue={className}
            helperText="Classes CSS personnalisées pour le menu"
          />
        </div>
      </div>
    </>
  );
}

// 3 levels deep
export const query = `
  query Query($settings: JSON) {
    basicMenuWidget(settings: $settings) {
      menus {
        id
        name
        url
        type
        uuid
        children {
          id
          name
          url
          type
          uuid
          children {
            id
            name
            url
            type
            uuid
            children {
              id
              name
              url
              type
              uuid
            }
          }
        }
      }
      isMain
      className
    }
  }
`;

export const variables = `{
  settings: getWidgetSetting()
}`;
